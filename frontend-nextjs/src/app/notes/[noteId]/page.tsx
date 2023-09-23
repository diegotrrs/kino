import api from '@/lib/graphql/api';
import styles from '../Notes.module.css';

export default async function NotePage({ params }: any) {
  const response = await api.getNoteById(params.noteId);
  
  const note = response.getNoteById
  return (
    <div>
      <h1>notes/{note?.id}</h1>
      <div className={styles.note}>
        <h3>{note?.name}</h3>
        <p>{note?.completed}</p>
      </div>
    </div>
  );
}
