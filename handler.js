import {
  DeleteItemCommand,
  DynamoDBClient,
  GetItemCommand,
  PutItemCommand,
  ScanCommand,
  UpdateItemCommand,
} from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
const TABLE_NAME = process.env.TABLE_NAME;

const ddbClient = new DynamoDBClient({
  region: "ap-south-1",
  // maxAttempts: 3,
  // requestHandler: new NodeHttpHandler({
  //   connectionTimeout: 5000,
  //   socketTimeout: 3000,
  // }),
  // endpoint: "http://localhost:8000",
});
export const createNote = async (event, context, cb) => {
  context.callbackWaitsForEmptyEventLoop = false;
  const data = JSON.parse(event.body);
  const params = {
    TableName: TABLE_NAME,
    Item: marshall({
      notesId: data.id,
      title: data.title,
      body: data.body,
    }),
    conditionExpression: "attribute_not_exists(notesId)",
  };

  try {
    const response = await ddbClient.send(new PutItemCommand(params));
    if (response) return send(201, { message: "Note created!" });
    else return send(500, { message: "Could not create note!" });
  } catch (error) {
    console.log(error);
    return send(500, `Error: ${error.message}`);
  }
};

export const getNote = async (event, context, cb) => {
  context.callbackWaitsForEmptyEventLoop = false;
  const noteId = event.pathParameters.id;
  const params = {
    TableName: TABLE_NAME,
    Key: marshall({
      notesId: noteId,
    }),
    conditionExpression: "attribute_exists(notesId)",
  };

  try {
    const response = await ddbClient.send(new GetItemCommand(params));
    return send(200, unmarshall(response.Item));
  } catch (error) {
    console.log(error);
    return send(500, `Error: ${error.message}`);
  }
};

export const updateNote = async (event, context, cb) => {
  context.callbackWaitsForEmptyEventLoop = false;
  const noteId = event.pathParameters.id;
  const data = JSON.parse(event.body);
  const params = {
    TableName: TABLE_NAME,
    Key: marshall({
      notesId: noteId,
    }),
    UpdateExpression: `set #title = :title, #body = :body`,
    ExpressionAttributeNames: {
      "#title": "title",
      "#body": "body",
    },
    ExpressionAttributeValues: marshall({
      ":title": data.title,
      ":body": data.body,
    }),
    conditionExpression: "attribute_exists(notesId)",
  };

  try {
    await ddbClient.send(new UpdateItemCommand(params));
    return send(200, data);
  } catch (error) {
    console.log(error);
    return send(500, `Error: ${error.message}`);
  }
};

export const deleteNote = async (event, context, cb) => {
  context.callbackWaitsForEmptyEventLoop = false;
  const noteId = event.pathParameters.id;
  const params = {
    TableName: TABLE_NAME,
    Key: marshall({
      notesId: noteId,
    }),
    conditionExpression: "attribute_exists(notesId)",
  };

  try {
    await ddbClient.send(new DeleteItemCommand(params));
    return send(200, { message: "Note deleted" });
  } catch (error) {
    console.log(error);
    return send(500, `Error: ${error.message}`);
  }
};

export const getAllNotes = async (event, context, cb) => {
  context.callbackWaitsForEmptyEventLoop = false;
  const params = {
    TableName: TABLE_NAME,
  };

  try {
    const response = await ddbClient.send(new ScanCommand(params));
    const items = response.Items.map((item) => unmarshall(item));
    return send(200, items);
  } catch (error) {
    console.log(error);
    return send(500, `Error: ${error.message}`);
  }
};
function send(statusCode, data) {
  return {
    statusCode,
    body: JSON.stringify(data),
  };
}

// https://mynotesdomain.auth.ap-south-1.amazoncognito.com/login?response_type=token&client_id=55noep9ad9qntph39v3rmfu7hj&redirect_uri=http://localhost:3000
