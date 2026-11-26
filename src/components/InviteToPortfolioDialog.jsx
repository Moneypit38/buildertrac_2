import GuestLinkDialog from "./GuestLinkDialog";

// Sharing a whole portfolio now works through private guest links (no account or payment needed).
export default function InviteToPortfolioDialog({ open, onClose, portfolioName }) {
  return (
    <GuestLinkDialog
      open={open}
      onClose={onClose}
      scope={{ type: "portfolio", portfolioName, label: portfolioName }}
    />
  );
}
