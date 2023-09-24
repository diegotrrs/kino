import Link from 'next/link';
import styles from './Notes.module.css';
import api from '@/lib/graphql/api';
import { alwaysArray } from '@/lib/util/alwaysArray';
import { Note } from '@/lib/graphql/generated';


export default async function NotesPage() {
  const response = await api.getAllNotes();

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
