import { cookies } from "next/headers"
import { redirect } from "next/navigation"

export default async function HomePage() {
  const cookieStore = await cookies()
  const session = cookieStore.get("opspilot_session")

  if (session) {
    redirect("/dashboard")
  }

  redirect("/login")
}
