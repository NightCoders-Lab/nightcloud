import ErrorMessage from "./ErrorMessage";
import Modal from "./Modal";

type ErrorModalProps = {
  message: string;
  isOpen: boolean;
  closeModal: () => void;
};

export default function ErrorModal({
  message,
  isOpen,
  closeModal,
}: Readonly<ErrorModalProps>) {
  return (
    <Modal title="Error" open={isOpen} close={closeModal}>
      <ErrorMessage>
        {message || "An unexpected error occurred"}
        {""}
        <span className="flex items-center justify-center tracking-wider text-center">
          Please try again later.
        </span>
      </ErrorMessage>
    </Modal>
  );
}
