import Link from 'next/link';

export const metadata = {
  title: 'Privacy Policy — AppForge',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-300">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold text-white mb-8">Privacy Policy</h1>
        <div className="prose prose-invert prose-slate max-w-none space-y-6 text-sm leading-relaxed">
          <p className="text-slate-400">Last updated: September 5, 2026</p>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">1. Information We Collect</h2>
            <p><strong className="text-slate-200">Account information:</strong> Email address, name, and authentication data when you sign up.</p>
            <p><strong className="text-slate-200">Project data:</strong> App ideas, prompts, generated code, and project metadata you create.</p>
            <p><strong className="text-slate-200">Usage data:</strong> IP address, browser type, and interaction logs for security and analytics.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">2. How We Use Your Information</h2>
            <ul className="list-disc list-inside space-y-1.5">
              <li>To create and manage your account</li>
              <li>To process your app ideas through AI agents and generate code</li>
              <li>To display your projects and analytics on your dashboard</li>
              <li>To improve our AI models and service quality</li>
              <li>To communicate with you about your account</li>
              <li>To prevent abuse and ensure security</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">3. Data Storage</h2>
            <p>Your data is stored securely using Supabase (PostgreSQL) with row-level security policies. Your projects are isolated to your account — other users cannot access your data.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">4. Authentication Data</h2>
            <p>When you sign in with Google or GitHub, we receive your email address and profile name. We do not access or store your passwords for OAuth providers. Email/password authentication is handled securely by Supabase Auth.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">5. AI Processing</h2>
            <p>Your app ideas and prompts are sent to AI providers (Telnyx Inference and Letta) for processing. These providers may temporarily process your data to generate responses. We do not use your data to train external AI models.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">6. Data Sharing</h2>
            <p>We do not sell or rent your data. We share data only with: (a) AI providers necessary to generate your code; (b) hosting providers (Supabase) for storage; (c) legal authorities when required by law.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">7. Your Rights</h2>
            <ul className="list-disc list-inside space-y-1.5">
              <li>Access your data through your dashboard</li>
              <li>Delete your projects at any time</li>
              <li>Delete your account and associated data</li>
              <li>Export your generated code</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">8. Data Retention</h2>
            <p>Your projects and generated code are retained for as long as your account is active. When you delete a project, it is permanently removed. When you delete your account, all associated data is deleted within 30 days.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">9. Security</h2>
            <p>We use row-level security, encrypted connections (HTTPS), and secure authentication. However, no system is 100% secure. We recommend using strong passwords and OAuth where available.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">10. Children's Privacy</h2>
            <p>AppForge is not intended for users under 13. We do not knowingly collect data from children under 13.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">11. Changes to This Policy</h2>
            <p>We may update this Privacy Policy from time to time. We will notify you of significant changes through the platform.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">12. Contact</h2>
            <p>For privacy questions or data requests, contact us through the AppForge platform.</p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-800">
          <Link href="/signup" className="text-purple-400 hover:text-purple-300 transition text-sm">
            ← Back to sign up
          </Link>
        </div>
      </div>
    </div>
  );
}
