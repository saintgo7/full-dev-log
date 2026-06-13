package com.devlog.hub.settings

import com.intellij.openapi.components.*
import com.intellij.openapi.diagnostic.Logger
import com.intellij.openapi.options.Configurable
import com.intellij.ui.components.JBCheckBox
import com.intellij.ui.components.JBLabel
import com.intellij.ui.components.JBTextField
import com.intellij.util.ui.FormBuilder
import com.intellij.util.ui.JBUI
import java.util.UUID
import javax.swing.JComponent
import javax.swing.JPanel
import javax.swing.JSpinner
import javax.swing.SpinnerNumberModel

/**
 * Settings state for DevLog Hub
 */
class DevLogSettingsState : BaseState() {
    var serverUrl by string("http://localhost:3001")
    var agentId by string(UUID.randomUUID().toString())
    var autoConnect by property(false)
    var syncIntervalSeconds by property(30)
    var trackFileChanges by property(true)
    var trackGitOperations by property(true)
    var trackBuildEvents by property(true)
    var enableDebugLogging by property(false)
}

/**
 * Persistent settings service for DevLog Hub
 */
@State(
    name = "DevLogHubSettings",
    storages = [Storage("DevLogHubSettings.xml")]
)
@Service(Service.Level.APP)
class DevLogSettings : SimplePersistentStateComponent<DevLogSettingsState>(DevLogSettingsState()) {

    private val LOG = Logger.getInstance(DevLogSettings::class.java)

    companion object {
        fun getInstance(): DevLogSettings = service()
    }

    override fun loadState(state: DevLogSettingsState) {
        super.loadState(state)
        LOG.info("DevLog Hub settings loaded")
    }
}

/**
 * Settings configurable UI for DevLog Hub
 */
class DevLogSettingsConfigurable : Configurable {

    private var settingsPanel: JPanel? = null

    // UI components
    private val serverUrlField = JBTextField()
    private val agentIdField = JBTextField()
    private val autoConnectCheckbox = JBCheckBox("Auto-connect on IDE startup")
    private val syncIntervalSpinner = JSpinner(SpinnerNumberModel(30, 5, 300, 5))
    private val trackFileChangesCheckbox = JBCheckBox("Track file changes")
    private val trackGitOperationsCheckbox = JBCheckBox("Track Git operations")
    private val trackBuildEventsCheckbox = JBCheckBox("Track build events")
    private val enableDebugLoggingCheckbox = JBCheckBox("Enable debug logging")

    override fun getDisplayName(): String = "DevLog Hub"

    override fun createComponent(): JComponent {
        settingsPanel = FormBuilder.createFormBuilder()
            .addLabeledComponent(JBLabel("Server URL:"), serverUrlField, 1, false)
            .addLabeledComponent(JBLabel("Agent ID:"), agentIdField, 1, false)
            .addComponent(autoConnectCheckbox)
            .addSeparator()
            .addLabeledComponent(JBLabel("Sync interval (seconds):"), syncIntervalSpinner, 1, false)
            .addSeparator()
            .addComponent(JBLabel("Tracking Options:").apply {
                border = JBUI.Borders.emptyTop(10)
            })
            .addComponent(trackFileChangesCheckbox)
            .addComponent(trackGitOperationsCheckbox)
            .addComponent(trackBuildEventsCheckbox)
            .addSeparator()
            .addComponent(enableDebugLoggingCheckbox)
            .addComponentFillVertically(JPanel(), 0)
            .panel

        return settingsPanel!!
    }

    override fun isModified(): Boolean {
        val settings = DevLogSettings.getInstance().state
        return serverUrlField.text != settings.serverUrl ||
               agentIdField.text != settings.agentId ||
               autoConnectCheckbox.isSelected != settings.autoConnect ||
               (syncIntervalSpinner.value as Int) != settings.syncIntervalSeconds ||
               trackFileChangesCheckbox.isSelected != settings.trackFileChanges ||
               trackGitOperationsCheckbox.isSelected != settings.trackGitOperations ||
               trackBuildEventsCheckbox.isSelected != settings.trackBuildEvents ||
               enableDebugLoggingCheckbox.isSelected != settings.enableDebugLogging
    }

    override fun apply() {
        val settings = DevLogSettings.getInstance().state
        settings.serverUrl = serverUrlField.text
        settings.agentId = agentIdField.text
        settings.autoConnect = autoConnectCheckbox.isSelected
        settings.syncIntervalSeconds = syncIntervalSpinner.value as Int
        settings.trackFileChanges = trackFileChangesCheckbox.isSelected
        settings.trackGitOperations = trackGitOperationsCheckbox.isSelected
        settings.trackBuildEvents = trackBuildEventsCheckbox.isSelected
        settings.enableDebugLogging = enableDebugLoggingCheckbox.isSelected
    }

    override fun reset() {
        val settings = DevLogSettings.getInstance().state
        serverUrlField.text = settings.serverUrl
        agentIdField.text = settings.agentId
        autoConnectCheckbox.isSelected = settings.autoConnect
        syncIntervalSpinner.value = settings.syncIntervalSeconds
        trackFileChangesCheckbox.isSelected = settings.trackFileChanges
        trackGitOperationsCheckbox.isSelected = settings.trackGitOperations
        trackBuildEventsCheckbox.isSelected = settings.trackBuildEvents
        enableDebugLoggingCheckbox.isSelected = settings.enableDebugLogging
    }

    override fun disposeUIResources() {
        settingsPanel = null
    }
}
