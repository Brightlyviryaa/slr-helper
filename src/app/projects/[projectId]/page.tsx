import { notFound } from "next/navigation"
import { getProjectWithDetails } from "@/actions/project"
import { MainLayout } from "@/components/layout/MainLayout"
import { ProtocolOnboarding } from "@/components/project/ProtocolOnboarding"
import { ProjectDashboard } from "@/components/project/ProjectDashboard"
import { getStudies } from "@/actions/study"

export default async function ProjectPage({ params }: { params: Promise<{ projectId: string }> }) {
    const { projectId } = await params
    const project = await getProjectWithDetails(projectId)

    if (!project) {
        notFound()
    }

    // If there is no protocol, show onboarding
    if (!project.protocol) {
        return (
            <MainLayout>
                <ProtocolOnboarding projectId={project.id} projectName={project.name} />
            </MainLayout>
        )
    }

    const studies = await getStudies(project.id)

    return (
        <MainLayout>
            <ProjectDashboard project={project} studies={studies} />
        </MainLayout>
    )
}
