import Image from "next/image";
import Link from "next/link";
import styles from "./page.module.css";
import { getVideos } from "./firebase/functions";

export default async function Home() {
  const videos = await getVideos();
  const processedVideos = videos.filter(v => v.status === "processed");

  return (
    <main>
      {
        processedVideos.map((video) => (
          <Link href={`/watch?v=${video.filename}`} key={video.id}>
            <Image src={'/thumbnail.png'} alt="video" width={120} height={80}
              className={styles.thumbnail} />
          </Link>
        )) 
      }
    </main>
  );
}

export const revalidate = 0;