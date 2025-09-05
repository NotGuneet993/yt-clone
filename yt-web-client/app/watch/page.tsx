'use cleint';

export default async function Watch({
  searchParams,
}: {
  searchParams: Promise<{ v?: string }>;
}) {
  const { v } = await searchParams;

  const videoPrefix =
    "https://storage.googleapis.com/3sept2025-yt-clone-processed-videos/";
  const videoSrc = typeof v === "string" ? v : undefined;

  return (
    <div>
      <h1>Watch</h1>
      <video controls src={videoSrc ? videoPrefix + videoSrc : undefined} />
    </div>
  );
}