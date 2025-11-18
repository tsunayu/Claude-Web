export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold text-center mb-8">
          Intelligent Alert Hub
        </h1>
        <p className="text-center text-muted-foreground mb-8">
          Your intelligent information collection and notification system
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-16">
          <div className="p-6 border rounded-lg">
            <h2 className="text-xl font-semibold mb-2">Multiple Sources</h2>
            <p className="text-muted-foreground">
              Collect information from RSS, Twitter, Web, and more
            </p>
          </div>
          <div className="p-6 border rounded-lg">
            <h2 className="text-xl font-semibold mb-2">Smart Filtering</h2>
            <p className="text-muted-foreground">
              Advanced filters with keyword matching and priorities
            </p>
          </div>
          <div className="p-6 border rounded-lg">
            <h2 className="text-xl font-semibold mb-2">Multi-Channel Notifications</h2>
            <p className="text-muted-foreground">
              Email, Push, Webhook, and Desktop notifications
            </p>
          </div>
          <div className="p-6 border rounded-lg">
            <h2 className="text-xl font-semibold mb-2">Customizable Dashboard</h2>
            <p className="text-muted-foreground">
              Manage all your settings in one place
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
