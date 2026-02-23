import type { GetServerSideProps } from "next";

export default function MintDisabled() {
  // Ne sera jamais rendu (notFound), mais on laisse un composant safe.
  return null;
}

export const getServerSideProps: GetServerSideProps = async () => {
  return { notFound: true };
};
