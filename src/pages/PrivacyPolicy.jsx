export default function PrivacyPolicy() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-12 text-foreground">
      <h1 className="text-3xl font-extrabold font-display mb-2">Privacy Policy</h1>
      <p className="text-sm text-muted-foreground mb-8">Last updated: July 8, 2026</p>

      <section className="space-y-6 text-sm leading-relaxed">
        <div>
          <h2 className="text-base font-bold mb-2">Overview</h2>
          <p>BuilderTrac ("we," "our," or "us") is a construction project management application. This Privacy Policy explains how we collect, use, and protect your information when you use our app.</p>
        </div>

        <div>
          <h2 className="text-base font-bold mb-2">Information We Collect</h2>
          <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
            <li><span className="text-foreground font-medium">Account Information:</span> Your name and email address when you register.</li>
            <li><span className="text-foreground font-medium">Project Data:</span> Project details, tasks, notes, appointments, and documents you create within the app.</li>
            <li><span className="text-foreground font-medium">Photos:</span> Site photos you upload to your projects.</li>
            <li><span className="text-foreground font-medium">Usage Data:</span> Basic app usage information to improve the service.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-base font-bold mb-2">How We Use Your Information</h2>
          <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
            <li>To provide and operate the BuilderTrac service</li>
            <li>To send task reminders and appointment notifications you've configured</li>
            <li>To enable team collaboration features within your projects</li>
            <li>To improve and maintain the app</li>
          </ul>
        </div>

        <div>
          <h2 className="text-base font-bold mb-2">Data Sharing</h2>
          <p className="text-muted-foreground">We do not sell your personal data. Your project data is only shared with team members and clients you explicitly invite. We use trusted third-party infrastructure providers (Base44) to host and operate the service.</p>
        </div>

        <div>
          <h2 className="text-base font-bold mb-2">Data Storage & Security</h2>
          <p className="text-muted-foreground">Your data is stored securely in the cloud. Each user's data is isolated and accessible only to authorized members of their projects. We use industry-standard encryption for data in transit and at rest.</p>
        </div>

        <div>
          <h2 className="text-base font-bold mb-2">Your Rights</h2>
          <p className="text-muted-foreground">You may request deletion of your account and associated data at any time by contacting us. You can also export or remove your project data directly within the app.</p>
        </div>

        <div>
          <h2 className="text-base font-bold mb-2">Children's Privacy</h2>
          <p className="text-muted-foreground">BuilderTrac is not directed at children under 13. We do not knowingly collect personal information from children.</p>
        </div>

        <div>
          <h2 className="text-base font-bold mb-2">Changes to This Policy</h2>
          <p className="text-muted-foreground">We may update this Privacy Policy from time to time. We'll notify users of significant changes via the app or email.</p>
        </div>

        <div>
          <h2 className="text-base font-bold mb-2">Contact Us</h2>
          <p className="text-muted-foreground">If you have questions about this Privacy Policy, please contact us through the app's support channel.</p>
        </div>
      </section>
    </div>
  );
}