import AnalysisForm from "../components/AnalysisForm";

export default function Home() {
  return (
    <div>
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Market Intelligence</h1>
        <p className="text-gray-600">
          Paste competitor names and source URLs to generate a structured intelligence report.
        </p>
      </div>
      <AnalysisForm />
    </div>
  );
}
