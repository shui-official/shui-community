import { FC, useState, useEffect } from "react";
import useSWR from "swr";
import Image from "next/image";
import { EyeOffIcon } from "@heroicons/react/outline";

import { fetcher } from "../../utils/fetcher";

type Props = {
  details: any;
  onSelect: (id: string) => void;
  onTokenDetailsFetched?: (props: any) => unknown;
};

export const NftCard: FC<Props> = ({ details, onSelect, onTokenDetailsFetched = () => {} }) => {
  const [fallbackImage, setFallbackImage] = useState(false);
  const { name, uri } = details?.data ?? {};

  const { data, error } = useSWR(uri, fetcher, {
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  });

  useEffect(() => {
    if (!error && !!data) {
      onTokenDetailsFetched(data);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, error]);

  const { image } = data ?? {};
  const imgSrc = typeof image === "string" ? image : "";
  const altText = name ? `${name} preview` : "NFT preview";

  const showImage = !fallbackImage && !error && !!imgSrc;

  return (
    <div className="card bordered max-w-xs compact rounded-md">
      <figure className="min-h-16 animation-pulse-color">
        {showImage ? (
          <div className="relative w-full h-48 bg-gray-800">
            <Image
              src={imgSrc}
              alt={altText}
              layout="fill"
              objectFit="cover"
              unoptimized
              loader={({ src }) => src}
              onError={() => setFallbackImage(true)}
            />
          </div>
        ) : (
          <div className="w-auto h-48 flex items-center justify-center bg-gray-900 bg-opacity-40">
            <EyeOffIcon className="h-16 w-16 text-white-500" />
          </div>
        )}
      </figure>

      <div className="card-body">
        <h2 className="card-title text-sm text-left">{name}</h2>
      </div>
    </div>
  );
};
