import { Mail, MessageSquare, HelpCircle, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

const faqs = [
  {
    q: "How do I create a new project?",
    a: "Tap the Projects tab at the bottom, then tap the '+' button in the top right to create a new project. Give it a name, address, and assign it to a portfolio if needed."
  },
  {
    q: "How do I add team members to a project?",
    a: "Open the project, go to the Team tab, and tap 'Invite Member'. Enter their email address and assign them a role (Admin, Team Member, or Client)."
  },
  {
    q: "How do I upload site photos?",
    a: "Open a project and tap the Photos tab. Tap '+ Add Photo' to upload an image from your device. You can add a title and description to each photo."
  },
  {
    q: "Can clients see my project data?",
    a: "Yes, but only what you share. When you invite someone as a 'Client' role, they can view documents and photos but cannot see tasks, financials, or team details."
  },
  {
    q: "How do I track my budget?",
    a: "Open a project and tap the edit (pencil) icon in the header. You can set a Total Budget and update the Spent amount. A progress bar will show your budget usage."
  },
  {
    q: "How do I delete my account?",
    a: "Go to Settings (tap your avatar in the top right), scroll down, and tap 'Delete Account'. You can also visit buildertrac.base44.app/delete-account."
  },
  {
    q: "Is my data secure?",
    a: "Yes. All data is encrypted in transit and at rest. Each user can only access their own projects and data unless explicitly invited to a shared project."
  },
];

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-5 py-4 text-left bg-white hover:bg-gray-50 transition-colors"
        onClick={() => setOpen(o => !o)}
      >
        <span className="font-medium text-gray-900 text-sm pr-4">{q}</span>
        {open ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />}
      </button>
      {open && (
        <div className="px-5 py-4 bg-gray-50 border-t border-gray-200 text-sm text-gray-600 leading-relaxed">
          {a}
        </div>
      )}
    </div>
  );
}

export default function Support() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-6 py-5 flex items-center justify-between">
          <Link to="/" className="text-xl font-extrabold text-gray-900 tracking-tight">
            Builder<span style={{ color: "#F5A623" }}>T</span>rac
          </Link>
          <span className="text-sm text-gray-500">Support</span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-10 space-y-10">

        {/* Hero */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-orange-100 mb-4">
            <HelpCircle className="w-7 h-7 text-orange-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">How can we help?</h1>
          <p className="text-gray-500 text-sm">Find answers to common questions or reach out directly.</p>
        </div>

        {/* Contact card */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-orange-500" /> Contact Support
          </h2>
          <p className="text-sm text-gray-600">
            Have a question, found a bug, or need help with your account? Send us an email and we'll get back to you within 1 business day.
          </p>
          <a
            href="mailto:support@mybuildertrac.com"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 transition-colors"
          >
            <Mail className="w-4 h-4" />
            support@mybuildertrac.com
          </a>
          <div className="pt-2 border-t border-gray-100 text-xs text-gray-400">
            <p>Support hours: Monday – Friday, 9am – 5pm CT</p>
          </div>
        </div>

        {/* FAQ */}
        <div>
          <h2 className="font-semibold text-gray-900 mb-4">Frequently Asked Questions</h2>
          <div className="space-y-2">
            {faqs.map((faq, i) => <FAQItem key={i} q={faq.q} a={faq.a} />)}
          </div>
        </div>

        {/* Footer links */}
        <div className="text-center text-xs text-gray-400 pb-6 space-x-4">
          <Link to="/privacy-policy" className="hover:underline">Privacy Policy</Link>
          <Link to="/delete-account" className="hover:underline">Delete Account</Link>
        </div>
      </div>
    </div>
  );
}