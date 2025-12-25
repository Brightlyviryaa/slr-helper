import { getProjects } from "@/actions/project"
import { MainLayout } from "@/components/layout/MainLayout"
import { ProjectList } from "@/components/dashboard/ProjectList"

// Force dynamic because we are using server actions and database
export const dynamic = 'force-dynamic'

export default async function Home() {
  const projects = await getProjects()

  return (
    <MainLayout>
      <ProjectList projects={projects} />
    </MainLayout>
  )
}
