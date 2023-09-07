import { Note } from "../../common/generated/types"
import { createItem, deleteItem, getItemById, listTableItems, updateItem } from "./util/dynamoDBUtils"

type AppSyncEvent = {
  info: {
    fieldName: string,
  },
  arguments: {
    noteId: string,
    note: Note,
  },
}

exports.handler = async (event: AppSyncEvent) => {
  switch (event.info.fieldName) {
    case "getNoteById":
      return await getItemById(process.env.NOTES_TABLE, event.arguments.noteId)
    case "createNote":
      return await createItem(process.env.NOTES_TABLE, event.arguments.note)
    case "listNotes":
      return await listTableItems(process.env.NOTES_TABLE)
    case "deleteNote":
      return await deleteItem(process.env.NOTES_TABLE, event.arguments.noteId)
    case "updateNote":
      return await updateItem(process.env.NOTES_TABLE, event.arguments.note)
    default:
      return null
  }
}
