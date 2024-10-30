import { Modal } from "flowbite-react";
import React, { useContext, useEffect, useState } from "react";
import Login from "./Login";
import Signup from "./Signup";
import ModalContext from "../context/modalContext";

const UserAuthModal = () => {
  const { showModal, setShowModal, isLogin, setIsLogin } =
    useContext(ModalContext);

  const onClose = () => {
    setShowModal(false);
  };

  return (
    <Modal
      show={showModal}
      size="md"
      closable="true"
      popup={true}
      onClose={onClose}
      className="bg-zinc-900 backdrop-opacity-10 border border-zinc-750 backdrop-blur-xl"
      style={{ height: "100%", backdropFilter: "blur(6px)" }}
    >
      <Modal.Header className="bg-zinc-800" />
      <Modal.Body className="bg-zinc-800">
        {isLogin ? <Login /> : <Signup />}
      </Modal.Body>
    </Modal>
  );
};

export default UserAuthModal;
