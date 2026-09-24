import Foundation
import ServiceManagement

// The same executable has two entry points. DuckieTV calls it with a command
// to manage the bundled LaunchAgent; launchd runs it without arguments at login.
private let service = SMAppService.agent(plistName: "tv.duckie.DuckieTV.login.plist")

func fail(_ message: String) -> Never {
    fputs(message + "\n", stderr)
    exit(1)
}

switch CommandLine.arguments.dropFirst().first {
case "status":
    switch service.status {
    case .enabled:
        print("enabled")
    case .requiresApproval:
        print("requiresApproval")
    case .notRegistered, .notFound:
        print("disabled")
    @unknown default:
        print("disabled")
    }
case "enable":
    if service.status == .enabled {
        print("enabled")
        break
    }
    if service.status == .requiresApproval {
        print("requiresApproval")
        break
    }
    do {
        try service.register()
    } catch {
        fail("Could not register DuckieTV at login: \(error.localizedDescription)")
    }
    print(service.status == .enabled ? "enabled" : "requiresApproval")
case "disable":
    if service.status != .notRegistered && service.status != .notFound {
        do {
            try service.unregister()
        } catch {
            fail("Could not remove DuckieTV from login items: \(error.localizedDescription)")
        }
    }
    print("disabled")
case nil:
    // Resolve the containing app at launch time so a moved app is opened from
    // its current location. The flag keeps this launch in the tray.
    let app = Bundle.main.bundleURL
    let process = Process()
    process.executableURL = URL(fileURLWithPath: "/usr/bin/open")
    process.arguments = ["-g", "-a", app.path, "--args", "--duckietv-start-in-tray"]
    do {
        try process.run()
        process.waitUntilExit()
    } catch {
        fail("Could not launch DuckieTV at login: \(error.localizedDescription)")
    }
    if process.terminationStatus != 0 {
        fail("Could not launch DuckieTV at login")
    }
default:
    fail("Expected status, enable, disable, or no argument")
}
