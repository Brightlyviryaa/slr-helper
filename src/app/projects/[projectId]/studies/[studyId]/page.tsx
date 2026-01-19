import { notFound } from "next/navigation"
import Link from "next/link"
import { ChevronLeft, ExternalLink, FileText, Calendar, Users, Tag, BookOpen, Database } from "lucide-react"
import { prisma } from "@/lib/prisma"
import { Button } from "@/components/ui/button"

interface StudyDetailPageProps {
    params: Promise<{ projectId: string; studyId: string }>
}

// Status badge colors
const statusColors: Record<string, string> = {
    TO_READ: "bg-slate-100 text-slate-700",
    READING: "bg-blue-100 text-blue-700",
    EXTRACTED: "bg-amber-100 text-amber-700",
    INCLUDED: "bg-green-100 text-green-700",
    EXCLUDED: "bg-red-100 text-red-700",
}

// Quality score badge
function QABadge({ score, label }: { score: number | null; label: string }) {
    const bgColor = score === 2 ? "bg-green-100 text-green-700" : score === 1 ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"
    return (
        <div className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${bgColor}`}>
            <span>{label}:</span>
            <span className="font-bold">{score ?? 0}</span>
        </div>
    )
}

// Section component
function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <section className="bg-white rounded-lg border border-slate-200 overflow-hidden">
            <h2 className="px-6 py-4 bg-slate-50 border-b border-slate-200 font-semibold text-slate-900">
                {title}
            </h2>
            <div className="p-6">
                {children}
            </div>
        </section>
    )
}

// Field display component
function Field({ label, value, multiline = false }: { label: string; value: string | number | null | undefined; multiline?: boolean }) {
    if (!value && value !== 0) {
        return (
            <div className="space-y-1">
                <dt className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</dt>
                <dd className="text-slate-400 italic">Not specified</dd>
            </div>
        )
    }

    return (
        <div className="space-y-1">
            <dt className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</dt>
            <dd className={`text-slate-800 ${multiline ? "whitespace-pre-wrap" : ""}`}>{value}</dd>
        </div>
    )
}

export default async function StudyDetailPage({ params }: StudyDetailPageProps) {
    const { projectId, studyId } = await params

    const study = await prisma.slrStudy.findUnique({
        where: { id: studyId },
        include: {
            project: {
                include: { protocol: true }
            },
            tags: true,
            qualityScores: true
        }
    })

    if (!study) {
        notFound()
    }

    // Fetch document status
    const document = await prisma.studyDocument.findFirst({
        where: { studyId },
        include: {
            chunks: {
                select: { id: true, embeddingId: true }
            }
        },
        orderBy: { uploadedAt: "desc" }
    })

    const docStatus = document ? {
        hasDocument: true,
        fileName: document.fileName,
        filePath: document.filePath,
        fileSize: document.fileSize,
        pageCount: document.pageCount,
        totalChunks: document.chunks.length,
        embeddedChunks: document.chunks.filter(c => c.embeddingId != null).length,
    } : null

    const qaTotal = (study.qaQ1 || 0) + (study.qaQ2 || 0) + (study.qaQ3 || 0) + (study.qaQ4 || 0) +
        (study.qaQ5 || 0) + (study.qaQ6 || 0) + (study.qaQ7 || 0) + (study.qaQ8 || 0)

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
                <div className="max-w-5xl mx-auto px-6 py-4">
                    <div className="flex items-center gap-4 mb-3">
                        <Link href={`/projects/${projectId}`}>
                            <Button variant="ghost" size="sm" className="gap-2">
                                <ChevronLeft size={16} />
                                Back to Project
                            </Button>
                        </Link>
                        <div className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs font-bold rounded uppercase">
                            {study.paperKey}
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[study.status] || statusColors.TO_READ}`}>
                            {study.status.replace("_", " ")}
                        </span>
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900">{study.title}</h1>
                    {study.authors && (
                        <p className="mt-2 text-slate-600 flex items-center gap-2">
                            <Users size={16} />
                            {study.authors}
                        </p>
                    )}
                </div>
            </header>

            {/* Content */}
            <main className="max-w-5xl mx-auto px-6 py-8 space-y-6">

                {/* Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-lg border border-slate-200 p-4">
                        <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
                            <Calendar size={14} />
                            Year
                        </div>
                        <div className="text-2xl font-bold text-slate-900">{study.year}</div>
                    </div>
                    <div className="bg-white rounded-lg border border-slate-200 p-4">
                        <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
                            <BookOpen size={14} />
                            Venue
                        </div>
                        <div className="text-lg font-semibold text-slate-900">{study.venue || "—"}</div>
                    </div>
                    <div className="bg-white rounded-lg border border-slate-200 p-4">
                        <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
                            <Tag size={14} />
                            Relevance
                        </div>
                        <div className="text-2xl font-bold text-slate-900">{study.relevanceScore || "—"} <span className="text-sm font-normal text-slate-500">/ 5</span></div>
                    </div>
                    <div className="bg-white rounded-lg border border-slate-200 p-4">
                        <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
                            <FileText size={14} />
                            Quality Score
                        </div>
                        <div className="text-2xl font-bold text-slate-900">{qaTotal} <span className="text-sm font-normal text-slate-500">/ 16</span></div>
                    </div>
                </div>

                {/* Links */}
                {(study.doi || study.url || study.pdfUrl) && (
                    <div className="flex flex-wrap gap-3">
                        {study.doi && (
                            <a href={`https://doi.org/${study.doi}`} target="_blank" rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                                <ExternalLink size={16} className="text-slate-500" />
                                <span className="text-sm font-medium">DOI: {study.doi}</span>
                            </a>
                        )}
                        {study.url && (
                            <a href={study.url} target="_blank" rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                                <ExternalLink size={16} className="text-slate-500" />
                                <span className="text-sm font-medium">Source URL</span>
                            </a>
                        )}
                        {study.pdfUrl && (
                            <a href={study.pdfUrl} target="_blank" rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors">
                                <FileText size={16} className="text-red-600" />
                                <span className="text-sm font-medium text-red-700">View PDF</span>
                            </a>
                        )}
                    </div>
                )}

                {/* Document Status */}
                <Section title="Document Status">
                    {docStatus ? (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Database size={20} className="text-slate-500" />
                                    <div>
                                        <p className="font-medium text-slate-800">{docStatus.fileName}</p>
                                        <p className="text-sm text-slate-500">
                                            {(docStatus.fileSize / 1024 / 1024).toFixed(2)} MB
                                            {docStatus.pageCount && ` • ${docStatus.pageCount} pages`}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="px-2 py-1 text-xs font-bold uppercase rounded bg-emerald-100 text-emerald-700">
                                        Indexed ✓
                                    </span>
                                    <a
                                        href={`/${docStatus.filePath}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-md hover:bg-indigo-100 transition-colors text-sm font-medium"
                                    >
                                        <ExternalLink size={14} />
                                        Open Document
                                    </a>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-3 border-t border-slate-100">
                                <div>
                                    <p className="text-xs font-semibold text-slate-500 uppercase">Total Chunks</p>
                                    <p className="text-lg font-bold text-slate-800">{docStatus.totalChunks}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-slate-500 uppercase">Embedded</p>
                                    <p className="text-lg font-bold text-slate-800">
                                        {docStatus.embeddedChunks} / {docStatus.totalChunks}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-slate-500 uppercase">Status</p>
                                    <p className={`text-lg font-bold ${docStatus.embeddedChunks === docStatus.totalChunks ? "text-emerald-600" : "text-amber-600"}`}>
                                        {docStatus.embeddedChunks === docStatus.totalChunks ? "Complete" : "Processing..."}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3 text-slate-500">
                            <Database size={20} />
                            <div>
                                <p className="font-medium">No document uploaded</p>
                                <p className="text-sm">Upload a PDF in the edit panel to index this study.</p>
                            </div>
                            <span className="ml-auto px-2 py-1 text-xs font-bold uppercase rounded bg-slate-200 text-slate-600">
                                Not Indexed
                            </span>
                        </div>
                    )}
                </Section>

                {/* Abstract */}
                {study.abstract && (
                    <Section title="Abstract">
                        <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{study.abstract}</p>
                    </Section>
                )}

                {/* Keywords */}
                {study.keywords && (
                    <Section title="Keywords">
                        <div className="flex flex-wrap gap-2">
                            {study.keywords.split(",").map((kw, i) => (
                                <span key={i} className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm">
                                    {kw.trim()}
                                </span>
                            ))}
                        </div>
                    </Section>
                )}

                {/* Classification */}
                <Section title="Classification">
                    <dl className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Field label="Research Type" value={study.researchType} />
                        <Field label="Domain" value={study.domain} />
                    </dl>
                </Section>

                {/* Research Content */}
                <Section title="Research Content">
                    <dl className="space-y-6">
                        <Field label="Problem Statement" value={study.problemStatement} multiline />
                        <Field label="Proposed Solution" value={study.proposedSolution} multiline />
                        <Field label="Key Techniques" value={study.keyTechniques} multiline />
                    </dl>
                </Section>

                {/* Methodology & Results */}
                <Section title="Methodology & Results">
                    <dl className="space-y-6">
                        <Field label="Data / Input Used" value={study.dataInputUsed} multiline />
                        <Field label="Output Artifact" value={study.outputArtifact} multiline />
                        <Field label="Evaluation Method" value={study.evaluationMethod} multiline />
                        <Field label="Metrics & Results" value={study.metricsResults} multiline />
                    </dl>
                </Section>

                {/* Qualitative Analysis */}
                <Section title="Qualitative Analysis">
                    <dl className="space-y-6">
                        <Field label="Strengths" value={study.strengths} multiline />
                        <Field label="Limitations" value={study.limitations} multiline />
                        <Field label="Research Gaps" value={study.gapNotes} multiline />
                        <Field label="Adoption for Thesis" value={study.adoptionForThesis} multiline />
                    </dl>
                </Section>

                {/* Quality Assessment */}
                <Section title="Quality Assessment">
                    <div className="space-y-4">
                        <div className="flex flex-wrap gap-2">
                            <QABadge score={study.qaQ1} label="Q1" />
                            <QABadge score={study.qaQ2} label="Q2" />
                            <QABadge score={study.qaQ3} label="Q3" />
                            <QABadge score={study.qaQ4} label="Q4" />
                            <QABadge score={study.qaQ5} label="Q5" />
                            <QABadge score={study.qaQ6} label="Q6" />
                            <QABadge score={study.qaQ7} label="Q7" />
                            <QABadge score={study.qaQ8} label="Q8" />
                            <div className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-100 text-indigo-700 rounded text-sm font-bold">
                                Total: {qaTotal}/16
                            </div>
                        </div>
                        {study.qaNotes && (
                            <div className="mt-4 p-4 bg-slate-50 rounded-lg">
                                <p className="text-sm text-slate-600 font-medium mb-1">Notes</p>
                                <p className="text-slate-800 whitespace-pre-wrap">{study.qaNotes}</p>
                            </div>
                        )}
                        <div className="text-xs text-slate-500 mt-2">
                            <p>Q1: Research objectives clearly stated • Q2: Methodology adequate • Q3: Sample size appropriate • Q4: Data collection described</p>
                            <p>Q5: Data analysis rigorous • Q6: Findings clearly stated • Q7: Validity addressed • Q8: Contribution clear</p>
                        </div>
                    </div>
                </Section>

                {/* Research Context */}
                <Section title="Research Context">
                    <dl className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Field label="Comparison Baseline" value={study.comparisonBaseline} />
                        <Field label="Study Context" value={study.studyContext} />
                        <Field label="Ambiguity Type" value={study.ambiguityType} />
                        <Field label="Quality Framework" value={study.qualityFramework} />
                    </dl>
                </Section>

                {/* Exclusion Reason */}
                {study.status === "EXCLUDED" && study.exclusionReason && (
                    <Section title="Exclusion Reason">
                        <p className="text-red-700">{study.exclusionReason}</p>
                    </Section>
                )}

                {/* Metadata */}
                <div className="text-sm text-slate-500 flex gap-4">
                    <span>Created: {new Date(study.createdAt).toLocaleDateString()}</span>
                    <span>Updated: {new Date(study.updatedAt).toLocaleDateString()}</span>
                </div>
            </main>
        </div>
    )
}
