import { Redirect } from 'expo-router';

export default function Index() {
  // Redireciona para a tela de login
  return <Redirect href="/login" />;
}
