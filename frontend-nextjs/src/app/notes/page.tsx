import Link from 'next/link';
import styles from './Notes.module.css';
import { fetchNotes } from '@/lib/graphql/api';
import { alwaysArray } from '@/lib/util/alwaysArray';
import { Note } from '@/lib/graphql/types';

// export const dynamic = 'auto',
//   dynamicParams = true,
//   revalidate = 0,
//   fetchCache = 'auto',
//   runtime = 'nodejs',
//   preferredRegion = 'auto'


async function getNotes() {
  // const db = new PocketBase('http://127.0.0.1:8090');
  // const result = await db.records.getList('notes');
  const res = await fetch('http://127.0.0.1:8090/api/collections/notes/records?page=1&perPage=30', { cache: 'no-store' });
  const data = await res.json();
  return data?.items as any[];
}


export default async function NotesPage() {
  const response = await fetchNotes();

  return(
    <div>
      <h1>Notes</h1>
      <div className={styles.grid}>
        {alwaysArray(response.getAllNotes).map((note) => {
          return <NoteCard key={note.id} note={note} />;
        })}
      </div>

    </div>
  );
}

type NoteCardProps = {
  note: Note;
}

const NoteCard = ({ note }: NoteCardProps) => {
  const { id, name, completed } = note
  return (
    <Link href={`/notes/${id}`}>
      <div className={styles.note}>
        <h2>{name}</h2>
        <p>{completed ? "done" : "incomplete"}</p>
      </div>
    </Link>
  );
}
