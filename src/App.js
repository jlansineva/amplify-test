import React, { useState, useEffect } from "react";
import "./App.css";
import "@aws-amplify/ui-react/styles.css";
import {b
  Button,
  Flex,
        Heading,
        Image,
  Text,
  TextField,
  View,
  withAuthenticator,
} from "@aws-amplify/ui-react";
import { listTodos } from "./graphql/queries";
import {
  createTodo as createTodoMutation,
  deleteTodo as deleteTodoMutation,
} from "./graphql/mutations";
import { generateClient } from 'aws-amplify/api';
import { getUrl, uploadData, remove } from 'aws-amplify/storage';

const client = generateClient();

const App = ({ signOut }) => {
  const [notes, setTodos] = useState([]);

  useEffect(() => {
    fetchTodos();
  }, []);

  async function fetchTodos() {
    const apiData = await client.graphql({ query: listTodos });
      const notesFromAPI = apiData.data.listTodos.items;
      await Promise.all(notesFromAPI.map(async (note) => {
          if (note.image) {
              const url = await getUrl(note.name);
              note.image = url;
          }
          return note;
      }))
    setTodos(notesFromAPI);
  }

  async function createTodo(event) {
    event.preventDefault();
      const form = new FormData(event.target);
      const image = form.get("image");
    const data = {
      name: form.get("name"),
        description: form.get("description"),
        image: image.name
    };
      if (!!data.image) await uploadData({
          key: data.name,
          data: image})
    await client.graphql({
      query: createTodoMutation,
      variables: { input: data },
    });
    fetchTodos();
    event.target.reset();
  }

  async function deleteTodo({ id }) {
    const newTodos = notes.filter((note) => note.id !== id);
      setTodos(newTodos);
      await remove({ key: note.image })
    await client.graphql({
      query: deleteTodoMutation,
      variables: { input: { id } },
    });
  }

  return (
    <View className="App">
      <Heading level={1}>My Todos App</Heading>
      <View as="form" margin="3rem 0" onSubmit={createTodo}>
        <Flex direction="row" justifyContent="center">
          <TextField
            name="name"
            placeholder="Todo Name"
            label="Todo Name"
            labelHidden
            variation="quiet"
            required
          />
          <TextField
            name="description"
            placeholder="Todo Description"
            label="Todo Description"
            labelHidden
            variation="quiet"
            required
          />
            <View name="image" as="input" type="file" style={{ alignSelf: "end"}} />
          <Button type="submit" variation="primary">
            Create Todo
          </Button>
        </Flex>
      </View>
      <Heading level={2}>Current Todos</Heading>
      <View margin="3rem 0">
        {notes.map((note) => (
          <Flex
            key={note.id || note.name}
            direction="row"
            justifyContent="center"
            alignItems="center"
          >
            <Text as="strong" fontWeight={700}>
              {note.name}
            </Text>
              <Text as="span">{note.description}</Text>
              {note.image && ( <Image src={note.image}
                                      alt={`visual aid for ${note.name}`}
                                      style={{ width: 400}})}
            <Button variation="link" onClick={() => deleteTodo(note)}>
              Delete note
            </Button>
          </Flex>
        ))}
      </View>
      <Button onClick={signOut}>Sign Out</Button>
    </View>
  );
};

export default withAuthenticator(App);
