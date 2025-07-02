import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

export default function SourcesIndexPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to the default source type (files)
    navigate(`/dashboard/chatbot/${id}/sources/file`);
  }, [id, navigate]);

  return null; // This component doesn't render anything, it just redirects
}
