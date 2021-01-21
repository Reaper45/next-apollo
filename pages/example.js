import { useMutation } from "@apollo/react-hooks";

import styles from '../styles/Home.module.css'

import SIGN_UP from "../graphql/mutations/signup.gql";

const Example = () => {
  const [signup, { data, loading }] = useMutation(SIGN_UP);

  // Dummy
  const handleClick = () => {
    signup({
      variables: {
        input: { phoneNumber: "" }
      }
    })
  }

  console.log({ loading, data })
  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <h1 className={styles.title}>
          Example page
        </h1>
        <br />
        <br />
        <button onClick={handleClick}>Simulate</button>
      </main>
    </div>
  )
}

export default Example;
