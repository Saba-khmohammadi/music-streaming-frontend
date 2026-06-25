import Link from 'next/link';
import { formatDate } from '@/lib/format';
import type { Album, Artist } from '@/types/domain';

export default function AlbumCard({ album, artist }: { album: Album; artist?: Artist }) {
  return (
    <Link className={`card ${album.isEarlyAccess ? 'highlight' : ''}`} href={`/albums/${album.id}`}>
      <img className="cover" src={album.coverUrl} alt={album.title} />
      <div className="badge">{album.type === 'album' ? 'Album' : 'Single'}</div>
      {album.isEarlyAccess ? <span className="badge warning" style={{ marginInlineStart: 8 }}>Early Access</span> : null}
      <h3>{album.title}</h3>
      <p className="muted">{artist?.name ?? 'Unknown artist'} · {formatDate(album.releaseDate)}</p>
    </Link>
  );
}
