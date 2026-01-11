package version

import (
	"fmt"
	"runtime"
)

// These variables are set at build time using ldflags
var (
	Version   = "dev"
	BuildTime = "unknown"
)

// Info returns version information
func Info() string {
	return fmt.Sprintf("DevLog Agent %s (built %s) %s/%s",
		Version, BuildTime, runtime.GOOS, runtime.GOARCH)
}

// Short returns just the version string
func Short() string {
	return Version
}
