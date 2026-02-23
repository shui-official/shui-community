import type { GetServerSideProps } from "next";

export default function MintDisabled() {
  return null;
}

export const getServerSideProps: GetServerSideProps = async () => {
  return { notFound: true };
};
