import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { auth as firebaseAuth } from "@/lib/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";

export const authOptions = {
  session: {
    strategy: "jwt",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Missing login parameters.");
        }

        try {
          // Authenticate directly with the Firebase system engine natively
          const userCredential = await signInWithEmailAndPassword(
            firebaseAuth, 
            credentials.email.trim(), 
            credentials.password
          );
          
          const user = userCredential.user;

          if (user) {
            return {
              id: user.uid,
              email: user.email,
              name: user.displayName || "Cloud User"
            };
          }
          return null;
        } catch (error) {
          console.error("NextAuth Firebase alignment crash:", error.message);
          throw new Error("Invalid email or password credentials entry.");
        }
      }
    })
  ],
  pages: {
    signIn: '/auth/signin', 
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.uid = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.uid;
      }
      return session;
    }
  }
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
