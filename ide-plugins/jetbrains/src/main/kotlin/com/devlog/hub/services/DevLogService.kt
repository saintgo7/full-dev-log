package com.devlog.hub.services

import com.intellij.openapi.Disposable
import com.intellij.openapi.application.ApplicationManager
import com.intellij.openapi.components.Service
import com.intellij.openapi.diagnostic.Logger
import com.devlog.hub.DevLogPlugin
import com.devlog.hub.settings.DevLogSettings
import io.ktor.client.*
import io.ktor.client.engine.cio.*
import io.ktor.client.plugins.contentnegotiation.*
import io.ktor.client.plugins.websocket.*
import io.ktor.serialization.kotlinx.json.*
import io.ktor.websocket.*
import kotlinx.coroutines.*
import kotlinx.coroutines.channels.Channel
import kotlinx.serialization.Serializable
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import java.util.concurrent.CopyOnWriteArrayList

/**
 * Service interface for DevLog Hub operations
 */
interface DevLogService {
    val isConnected: Boolean
    val connectionStatus: ConnectionStatus

    fun connect()
    fun disconnect()
    fun sendEvent(event: DevLogEvent)
    fun addConnectionListener(listener: ConnectionListener)
    fun removeConnectionListener(listener: ConnectionListener)
}

/**
 * Connection status enumeration
 */
enum class ConnectionStatus {
    DISCONNECTED,
    CONNECTING,
    CONNECTED,
    RECONNECTING,
    ERROR
}

/**
 * Listener interface for connection state changes
 */
interface ConnectionListener {
    fun onConnectionStatusChanged(status: ConnectionStatus)
    fun onError(message: String)
}

/**
 * Event data class for DevLog events
 */
@Serializable
data class DevLogEvent(
    val type: String,
    val timestamp: Long = System.currentTimeMillis(),
    val data: EventData
)

@Serializable
data class EventData(
    val filePath: String? = null,
    val language: String? = null,
    val linesChanged: Int? = null,
    val action: String? = null,
    val metadata: Map<String, String> = emptyMap()
)

/**
 * Implementation of DevLogService
 */
@Service(Service.Level.APP)
class DevLogServiceImpl : DevLogService, Disposable {

    private val LOG = Logger.getInstance(DevLogServiceImpl::class.java)

    private val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())
    private val eventChannel = Channel<DevLogEvent>(Channel.BUFFERED)
    private val listeners = CopyOnWriteArrayList<ConnectionListener>()

    private var client: HttpClient? = null
    private var webSocketSession: WebSocketSession? = null
    private var connectionJob: Job? = null

    private var _connectionStatus = ConnectionStatus.DISCONNECTED
    override val connectionStatus: ConnectionStatus
        get() = _connectionStatus

    override val isConnected: Boolean
        get() = _connectionStatus == ConnectionStatus.CONNECTED

    private val json = Json {
        ignoreUnknownKeys = true
        encodeDefaults = true
    }

    private val settings: DevLogSettings
        get() = ApplicationManager.getApplication().getService(DevLogSettings::class.java)

    override fun connect() {
        if (_connectionStatus == ConnectionStatus.CONNECTING || _connectionStatus == ConnectionStatus.CONNECTED) {
            LOG.info("Already connected or connecting")
            return
        }

        updateStatus(ConnectionStatus.CONNECTING)

        connectionJob = scope.launch {
            try {
                initializeClient()
                establishWebSocketConnection()
                startEventProcessor()
            } catch (e: Exception) {
                LOG.error("Failed to connect", e)
                updateStatus(ConnectionStatus.ERROR)
                notifyError("Connection failed: ${e.message}")
            }
        }
    }

    override fun disconnect() {
        scope.launch {
            try {
                webSocketSession?.close(CloseReason(CloseReason.Codes.NORMAL, "User disconnected"))
                connectionJob?.cancel()
                client?.close()
                client = null
                webSocketSession = null
                updateStatus(ConnectionStatus.DISCONNECTED)
                LOG.info("Disconnected from DevLog Hub server")
            } catch (e: Exception) {
                LOG.error("Error during disconnect", e)
            }
        }
    }

    override fun sendEvent(event: DevLogEvent) {
        if (!isConnected) {
            LOG.warn("Cannot send event: not connected")
            return
        }

        scope.launch {
            eventChannel.send(event)
        }
    }

    override fun addConnectionListener(listener: ConnectionListener) {
        listeners.add(listener)
    }

    override fun removeConnectionListener(listener: ConnectionListener) {
        listeners.remove(listener)
    }

    private fun initializeClient() {
        client = HttpClient(CIO) {
            install(WebSockets)
            install(ContentNegotiation) {
                json(json)
            }
        }
    }

    private suspend fun establishWebSocketConnection() {
        val serverUrl = settings.state.serverUrl
        val wsUrl = serverUrl.replace("http://", "ws://").replace("https://", "wss://")

        LOG.info("Connecting to WebSocket: $wsUrl/ws")

        client?.webSocket("$wsUrl/ws") {
            webSocketSession = this
            updateStatus(ConnectionStatus.CONNECTED)
            LOG.info("Connected to DevLog Hub server")

            // Send authentication message
            val authMessage = json.encodeToString(mapOf(
                "type" to "auth",
                "agentId" to settings.state.agentId,
                "source" to "jetbrains"
            ))
            send(Frame.Text(authMessage))

            // Handle incoming messages
            for (frame in incoming) {
                when (frame) {
                    is Frame.Text -> {
                        val text = frame.readText()
                        LOG.debug("Received: $text")
                        handleIncomingMessage(text)
                    }
                    is Frame.Close -> {
                        LOG.info("WebSocket closed")
                        updateStatus(ConnectionStatus.DISCONNECTED)
                    }
                    else -> {}
                }
            }
        }
    }

    private fun startEventProcessor() {
        scope.launch {
            for (event in eventChannel) {
                try {
                    val message = json.encodeToString(event)
                    webSocketSession?.send(Frame.Text(message))
                    LOG.debug("Sent event: ${event.type}")
                } catch (e: Exception) {
                    LOG.error("Failed to send event", e)
                }
            }
        }
    }

    private fun handleIncomingMessage(message: String) {
        // Handle server messages (acknowledgments, commands, etc.)
        LOG.debug("Processing message: $message")
    }

    private fun updateStatus(status: ConnectionStatus) {
        _connectionStatus = status
        ApplicationManager.getApplication().invokeLater {
            listeners.forEach { it.onConnectionStatusChanged(status) }
        }
    }

    private fun notifyError(message: String) {
        ApplicationManager.getApplication().invokeLater {
            listeners.forEach { it.onError(message) }
        }
    }

    override fun dispose() {
        disconnect()
        scope.cancel()
        eventChannel.close()
    }
}
