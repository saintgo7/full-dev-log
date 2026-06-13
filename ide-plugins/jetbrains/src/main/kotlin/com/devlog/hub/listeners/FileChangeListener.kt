package com.devlog.hub.listeners

import com.intellij.openapi.application.ApplicationManager
import com.intellij.openapi.diagnostic.Logger
import com.intellij.openapi.fileTypes.FileTypeManager
import com.intellij.openapi.vfs.newvfs.BulkFileListener
import com.intellij.openapi.vfs.newvfs.events.*
import com.devlog.hub.DevLogPlugin
import com.devlog.hub.services.DevLogEvent
import com.devlog.hub.services.EventData

/**
 * Listener for file system changes in the IDE.
 * Tracks file modifications, creations, deletions, and renames.
 */
class FileChangeListener : BulkFileListener {

    private val LOG = Logger.getInstance(FileChangeListener::class.java)

    // File extensions to track
    private val trackedExtensions = setOf(
        "kt", "java", "scala", "groovy",  // JVM languages
        "ts", "js", "tsx", "jsx",          // JavaScript/TypeScript
        "py", "rb", "go", "rs",            // Other languages
        "xml", "json", "yaml", "yml",      // Config files
        "md", "txt",                        // Documentation
        "sql", "graphql",                   // Database/API
        "html", "css", "scss", "sass"       // Web
    )

    // Directories to ignore
    private val ignoredDirectories = setOf(
        "node_modules", ".git", ".idea", ".gradle",
        "build", "target", "out", "dist", "__pycache__",
        ".next", ".nuxt", "vendor"
    )

    override fun after(events: MutableList<out VFileEvent>) {
        if (!DevLogPlugin.isConnected) {
            return
        }

        events.forEach { event ->
            if (shouldTrackEvent(event)) {
                processEvent(event)
            }
        }
    }

    private fun shouldTrackEvent(event: VFileEvent): Boolean {
        val file = event.file ?: return false

        // Skip directories
        if (file.isDirectory) return false

        // Check if in ignored directory
        val path = file.path
        if (ignoredDirectories.any { path.contains("/$it/") || path.contains("\\$it\\") }) {
            return false
        }

        // Check file extension
        val extension = file.extension?.lowercase() ?: return false
        return extension in trackedExtensions
    }

    private fun processEvent(event: VFileEvent) {
        val file = event.file ?: return

        ApplicationManager.getApplication().executeOnPooledThread {
            try {
                val devLogEvent = when (event) {
                    is VFileContentChangeEvent -> createContentChangeEvent(event)
                    is VFileCreateEvent -> createFileCreatedEvent(event)
                    is VFileDeleteEvent -> createFileDeletedEvent(event)
                    is VFilePropertyChangeEvent -> {
                        if (event.propertyName == VFilePropertyChangeEvent.PROP_NAME) {
                            createFileRenamedEvent(event)
                        } else null
                    }
                    is VFileMoveEvent -> createFileMovedEvent(event)
                    else -> null
                }

                devLogEvent?.let {
                    DevLogPlugin.service.sendEvent(it)
                    LOG.debug("Sent event: ${it.type} for ${file.path}")
                }
            } catch (e: Exception) {
                LOG.error("Failed to process file event", e)
            }
        }
    }

    private fun createContentChangeEvent(event: VFileContentChangeEvent): DevLogEvent {
        val file = event.file
        return DevLogEvent(
            type = "file.modified",
            data = EventData(
                filePath = file.path,
                language = detectLanguage(file.extension),
                action = "modified",
                metadata = mapOf(
                    "fileName" to file.name,
                    "extension" to (file.extension ?: ""),
                    "size" to file.length.toString()
                )
            )
        )
    }

    private fun createFileCreatedEvent(event: VFileCreateEvent): DevLogEvent {
        return DevLogEvent(
            type = "file.created",
            data = EventData(
                filePath = event.path,
                language = detectLanguage(event.childName.substringAfterLast('.', "")),
                action = "created",
                metadata = mapOf(
                    "fileName" to event.childName
                )
            )
        )
    }

    private fun createFileDeletedEvent(event: VFileDeleteEvent): DevLogEvent {
        val file = event.file
        return DevLogEvent(
            type = "file.deleted",
            data = EventData(
                filePath = file.path,
                language = detectLanguage(file.extension),
                action = "deleted",
                metadata = mapOf(
                    "fileName" to file.name
                )
            )
        )
    }

    private fun createFileRenamedEvent(event: VFilePropertyChangeEvent): DevLogEvent {
        val file = event.file
        return DevLogEvent(
            type = "file.renamed",
            data = EventData(
                filePath = file.path,
                language = detectLanguage(file.extension),
                action = "renamed",
                metadata = mapOf(
                    "oldName" to (event.oldValue as? String ?: ""),
                    "newName" to (event.newValue as? String ?: ""),
                    "fileName" to file.name
                )
            )
        )
    }

    private fun createFileMovedEvent(event: VFileMoveEvent): DevLogEvent {
        val file = event.file
        return DevLogEvent(
            type = "file.moved",
            data = EventData(
                filePath = file.path,
                language = detectLanguage(file.extension),
                action = "moved",
                metadata = mapOf(
                    "oldPath" to event.oldPath,
                    "newPath" to event.newPath,
                    "fileName" to file.name
                )
            )
        )
    }

    private fun detectLanguage(extension: String?): String {
        return when (extension?.lowercase()) {
            "kt" -> "kotlin"
            "java" -> "java"
            "scala" -> "scala"
            "groovy" -> "groovy"
            "ts", "tsx" -> "typescript"
            "js", "jsx" -> "javascript"
            "py" -> "python"
            "rb" -> "ruby"
            "go" -> "go"
            "rs" -> "rust"
            "xml" -> "xml"
            "json" -> "json"
            "yaml", "yml" -> "yaml"
            "md" -> "markdown"
            "sql" -> "sql"
            "graphql" -> "graphql"
            "html" -> "html"
            "css" -> "css"
            "scss", "sass" -> "scss"
            else -> "unknown"
        }
    }
}
