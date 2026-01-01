import Modal from "./Modal";

type LoadingModalProps = {
  isOpen: boolean;
  closeModal: () => void;
};

export default function LoadingModal({
  isOpen,
  closeModal,
}: Readonly<LoadingModalProps>) {
  return (
    <Modal title="Loading..." open={isOpen} close={closeModal} size="small">
      <div className="flex flex-col p-6 gap-4 mt-4 items-center justify-center">
        <div className="w-12 h-12 border-4 border-t-transparent border-night-text rounded-full animate-spin mb-4" />
        <p className="text-night-muted">
          Please wait while we process your request...
        </p>
      </div>
    </Modal>
  );
}
