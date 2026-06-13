package com.devlog.hub.actions

import com.intellij.ide.BrowserUtil
import com.intellij.notification.NotificationGroupManager
import com.intellij.notification.NotificationType
import com.intellij.openapi.actionSystem.AnAction
import com.intellij.openapi.actionSystem.AnActionEvent
import com.intellij.openapi.diagnostic.Logger
import com.devlog.hub.DevLogPlugin
import com.devlog.hub.services.ConnectionStatus
import com.devlog.hub.services.DevLogEvent
import com.devlog.hub.services.EventData

/**
 * Action to connect to DevLog Hub server
 */
class ConnectAction : AnAction() {

    private val LOG = Logger.getInstance(ConnectAction::class.java)

    override fun actionPerformed(e: AnActionEvent) {
        LOG.info("Connect action triggered")

        val service = DevLogPlugin.service
        if (service.isConnected) {
            showNotification("Already Connected", "Already connected to DevLog Hub server", NotificationType.INFORMATION)
            return
        }

        service.connect()
        showNotification("Connecting", "Connecting to DevLog Hub server...", NotificationType.INFORMATION)
    }

    override fun update(e: AnActionEvent) {
        e.presentation.isEnabled = !DevLogPlugin.isConnected
    }
}

/**
 * Action to disconnect from DevLog Hub server
 */
class DisconnectAction : AnAction() {

    private val LOG = Logger.getInstance(DisconnectAction::class.java)

    override fun actionPerformed(e: AnActionEvent) {
        LOG.info("Disconnect action triggered")

        val service = DevLogPlugin.service
        if (!service.isConnected) {
            showNotification("Not Connected", "Not connected to DevLog Hub server", NotificationType.WARNING)
            return
        }

        service.disconnect()
        showNotification("Disconnected", "Disconnected from DevLog Hub server", NotificationType.INFORMATION)
    }

    override fun update(e: AnActionEvent) {
        e.presentation.isEnabled = DevLogPlugin.isConnected
    }
}

/**
 * Action to manually sync events
 */
class SyncAction : AnAction() {

    private val LOG = Logger.getInstance(SyncAction::class.java)

    override fun actionPerformed(e: AnActionEvent) {
        LOG.info("Sync action triggered")

        val service = DevLogPlugin.service
        if (!service.isConnected) {
            showNotification("Not Connected", "Please connect to the server first", NotificationType.WARNING)
            return
        }

        // Send a sync event
        service.sendEvent(DevLogEvent(
            type = "sync.manual",
            data = EventData(
                action = "manual_sync",
                metadata = mapOf("source" to "user_action")
            )
        ))

        showNotification("Sync Triggered", "Manual sync triggered", NotificationType.INFORMATION)
    }

    override fun update(e: AnActionEvent) {
        e.presentation.isEnabled = DevLogPlugin.isConnected
    }
}

/**
 * Action to view insights in browser
 */
class ViewInsightsAction : AnAction() {

    private val LOG = Logger.getInstance(ViewInsightsAction::class.java)

    override fun actionPerformed(e: AnActionEvent) {
        LOG.info("View insights action triggered")

        val settings = DevLogPlugin.settings.state
        val baseUrl = settings.serverUrl.removeSuffix("/api")
        val dashboardUrl = "$baseUrl/dashboard"

        LOG.info("Opening dashboard: $dashboardUrl")
        BrowserUtil.browse(dashboardUrl)
    }

    override fun update(e: AnActionEvent) {
        // Always enabled - can view dashboard even when disconnected
        e.presentation.isEnabled = true
    }
}

/**
 * Helper function to show notifications
 */
private fun showNotification(title: String, content: String, type: NotificationType) {
    NotificationGroupManager.getInstance()
        .getNotificationGroup(DevLogPlugin.NOTIFICATION_GROUP_ID)
        .createNotification(title, content, type)
        .notify(null)
}
