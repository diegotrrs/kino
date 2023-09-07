import * as AWS from 'aws-sdk'
const docClient = new AWS.DynamoDB.DocumentClient()

type DbTableName = string | undefined
type DbItem = { [key: string]: unknown | null }

export const createItem = async (tableName: DbTableName, item: DbItem) => {
  if (!tableName) return

  const params = {
    TableName: tableName,
    Item: item,
  }
  try {
    await docClient.put(params).promise()
    return item
  } catch (err) {
    console.log("DynamoDB error: ", err)
    return null
  }
}

export const deleteItem = async (tableName: DbTableName, itemId: string) => {
  if (!tableName) return

  const params = {
    TableName: tableName,
    Key: {
      id: itemId,
    },
  }
  try {
    await docClient.delete(params).promise()
    return itemId
  } catch (err) {
    console.log("DynamoDB error: ", err)
    return null
  }
}

export const getItemById = async (tableName: DbTableName, itemId: string) => {
  if (!tableName) return

  const params = {
    TableName: tableName,
    Key: { id: itemId },
  }

  try {
    const { Item } = await docClient.get(params).promise()
    return Item
  } catch (err) {
    console.log("DynamoDB error: ", err)
    return
  }
}

export const listTableItems = async (tableName: DbTableName) =>  {
  if (!tableName) return

  const params = {
    TableName: tableName,
  }

  try {
    const data = await docClient.scan(params).promise()
    return data.Items
  } catch (err) {
    console.log("DynamoDB error: ", err)
    return null
  }
}

type Params = {
  TableName: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Key: string | any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ExpressionAttributeValues: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ExpressionAttributeNames: any,  
  UpdateExpression: string,
  ReturnValues: string,
}

export const updateItem = async (tableName: DbTableName, item: DbItem) => {
  if (!tableName) return

  const params: Params = {
    TableName: tableName,
    Key: {
      id: item.id,
    },
    ExpressionAttributeValues: {},
    ExpressionAttributeNames: {},
    UpdateExpression: "",
    ReturnValues: "UPDATED_NEW",
  }

  let prefix = "set "
  const attributes = Object.keys(item)

  for (let i = 0; i < attributes.length; i++) {
    const attribute = attributes[i]
    if (attribute !== "id") {
      params["UpdateExpression"] +=
        prefix + "#" + attribute + " = :" + attribute
      params["ExpressionAttributeValues"][":" + attribute] = item[attribute]
      params["ExpressionAttributeNames"]["#" + attribute] = attribute
      prefix = ", "
    }
  }
  console.log("params: ", params)
  try {
    await docClient.update(params).promise()
    return item
  } catch (err) {
    console.log("DynamoDB error: ", err)
    return null
  }
}
