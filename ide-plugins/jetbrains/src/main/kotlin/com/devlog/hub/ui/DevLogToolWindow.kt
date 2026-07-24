package com.devlog.hub.ui

import com.intellij.openapi.application.ApplicationManager
import com.intellij.openapi.project.DumbAware
import com.intellij.openapi.project.Project
import com.intellij.openapi.wm.ToolWindow
import com.intellij.openapi.wm.ToolWindowFactory
import com.intellij.ui.components.JBLabel
import com.intellij.ui.components.JBPanel
import com.intellij.ui.components.JBScrollPane
import com.intellij.ui.content.ContentFactory
import com.intellij.util.ui.JBUI
import com.devlog.hub.DevLogPlugin
import com.devlog.hub.services.ConnectionListener
import com.devlog.hub.services.ConnectionStatus
import java.awt.BorderLayout
import java.awt.FlowLayout
import java.awt.GridBagConstraints
import java.awt.GridBagLayout
import javax.swing.*

/**
 * Tool window factory for DevLog Hub
 */
class DevLogToolWindowFactory : ToolWindowFactory, DumbAware {

    override fun createToolWindowContent(project: Project, toolWindow: ToolWindow) {
        val panel = DevLogToolWindowPanel()
        val content = ContentFactory.getInstance().createContent(panel, "", false)
        toolWindow.contentManager.addContent(content)
    }

    override fun shouldBeAvailable(project: Project): Boolean = true
}

/**
 * Main tool window panel
 */
class DevLogToolWindowPanel : JBPanel<DevLogToolWindowPanel>(BorderLayout()), ConnectionListener {

    private val statusLabel = JBLabel("Disconnected")
    private val statusIcon = JBLabel()
    private val connectButton = JButton("Connect")
    private val disconnectButton = JButton("Disconnect")
    private val syncButton = JButton("Sync Now")

    private val eventsCountLabel = JBLabel("Events: 0")
    private val lastSyncLabel = JBLabel("Last sync: Never")
    private val serverUrlLabel = JBLabel("Server: Not configured")

    private val activityList = DefaultListModel<String>()

    init {
        border = JBUI.Borders.empty(10)

        add(createHeaderPanel(), BorderLayout.NORTH)
        add(createActivityPanel(), BorderLayout.CENTER)
        add(createFooterPanel(), BorderLayout.SOUTH)

        setupListeners()
        updateUI()

        DevLogPlugin.service.addConnectionListener(this)
    }

    private fun createHeaderPanel(): JPanel {
        val panel = JBPanel<JBPanel<*>>(GridBagLayout())
        val gbc = GridBagConstraints().apply {
            fill = GridBagConstraints.HORIZONTAL
            insets = JBUI.insets(5)
        }

        // Status row
        gbc.gridx = 0
        gbc.gridy = 0
        gbc.weightx = 0.0
        panel.add(JBLabel("Status:"), gbc)

        gbc.gridx = 1
        gbc.weightx = 1.0
        val statusPanel = JBPanel<JBPanel<*>>(FlowLayout(FlowLayout.LEFT, 5, 0))
        statusPanel.add(statusIcon)
        statusPanel.add(statusLabel)
        panel.add(statusPanel, gbc)

        // Server URL row
        gbc.gridx = 0
        gbc.gridy = 1
        gbc.weightx = 0.0
        panel.add(JBLabel("Server:"), gbc)

        gbc.gridx = 1
        gbc.weightx = 1.0
        panel.add(serverUrlLabel, gbc)

        // Buttons row
        gbc.gridx = 0
        gbc.gridy = 2
        gbc.gridwidth = 2
        gbc.weightx = 1.0
        val buttonPanel = JBPanel<JBPanel<*>>(FlowLayout(FlowLayout.LEFT, 5, 0))
        buttonPanel.add(connectButton)
        buttonPanel.add(disconnectButton)
        buttonPanel.add(syncButton)
        panel.add(buttonPanel, gbc)

        panel.border = JBUI.Borders.emptyBottom(10)
        return panel
    }

    private fun createActivityPanel(): JComponent {
        val panel = JBPanel<JBPanel<*>>(BorderLayout())
        panel.border = JBUI.Borders.empty(10, 0)

        panel.add(JBLabel("Recent Activity:"), BorderLayout.NORTH)

        val list = JList(activityList)
        list.cellRenderer = ActivityListCellRenderer()

        val scrollPane = JBScrollPane(list)
        scrollPane.border = JBUI.Borders.empty(5, 0)
        panel.add(scrollPane, BorderLayout.CENTER)

        return panel
    }

    private fun createFooterPanel(): JPanel {
        val panel = JBPanel<JBPanel<*>>(GridBagLayout())
        val gbc = GridBagConstraints().apply {
            fill = GridBagConstraints.HORIZONTAL
            insets = JBUI.insets(2)
        }

        gbc.gridx = 0
        gbc.gridy = 0
        gbc.weightx = 1.0
        panel.add(eventsCountLabel, gbc)

        gbc.gridy = 1
        panel.add(lastSyncLabel, gbc)

        panel.border = JBUI.Borders.emptyTop(10)
        return panel
    }

    private fun setupListeners() {
        connectButton.addActionListener {
            DevLogPlugin.service.connect()
        }

        disconnectButton.addActionListener {
            DevLogPlugin.service.disconnect()
        }

        syncButton.addActionListener {
            // Trigger manual sync
            addActivity("Manual sync triggered")
        }
    }

    private fun updateUI() {
        val isConnected = DevLogPlugin.isConnected
        connectButton.isEnabled = !isConnected
        disconnectButton.isEnabled = isConnected
        syncButton.isEnabled = isConnected

        serverUrlLabel.text = DevLogPlugin.settings.state.serverUrl

        updateStatusDisplay(DevLogPlugin.service.connectionStatus)
    }

    private fun updateStatusDisplay(status: ConnectionStatus) {
        val (text, icon) = when (status) {
            ConnectionStatus.DISCONNECTED -> "Disconnected" to UIManager.getIcon("OptionPane.errorIcon")
            ConnectionStatus.CONNECTING -> "Connecting..." to UIManager.getIcon("OptionPane.informationIcon")
            ConnectionStatus.CONNECTED -> "Connected" to UIManager.getIcon("OptionPane.informationIcon")
            ConnectionStatus.RECONNECTING -> "Reconnecting..." to UIManager.getIcon("OptionPane.warningIcon")
            ConnectionStatus.ERROR -> "Error" to UIManager.getIcon("OptionPane.errorIcon")
        }

        statusLabel.text = text
        statusIcon.icon = icon
    }

    fun addActivity(activity: String) {
        ApplicationManager.getApplication().invokeLater {
            val timestamp = java.time.LocalTime.now().toString().substring(0, 8)
            activityList.add(0, "[$timestamp] $activity")

            // Keep only last 50 activities
            while (activityList.size > 50) {
                activityList.remove(activityList.size - 1)
            }
        }
    }

    override fun onConnectionStatusChanged(status: ConnectionStatus) {
        ApplicationManager.getApplication().invokeLater {
            updateStatusDisplay(status)
            updateUI()
            addActivity("Connection status: $status")
        }
    }

    override fun onError(message: String) {
        ApplicationManager.getApplication().invokeLater {
            addActivity("Error: $message")
        }
    }
}

/**
 * Custom cell renderer for activity list
 */
class ActivityListCellRenderer : DefaultListCellRenderer() {
    override fun getListCellRendererComponent(
        list: JList<*>?,
        value: Any?,
        index: Int,
        isSelected: Boolean,
        cellHasFocus: Boolean
    ): java.awt.Component {
        val component = super.getListCellRendererComponent(list, value, index, isSelected, cellHasFocus)
        border = JBUI.Borders.empty(2, 5)
        return component
    }
}
