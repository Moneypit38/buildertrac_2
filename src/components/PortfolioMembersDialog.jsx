import GuestLinkDialog from "./GuestLinkDialog";

// The portfolio "Team" screen now shares access through private guest links
// (no account or payment needed for customers and team members).
export default function PortfolioMembersDialog({ open, onClose, portfolio }) {
  return (
    <GuestLinkDialog
      open={open}
      onClose={onClose}
      scope={{ type: "portfolio", portfolioId: portfolio?.id, portfolioName: portfolio?.name, label: portfolio?.name }}
    />
  );
}
