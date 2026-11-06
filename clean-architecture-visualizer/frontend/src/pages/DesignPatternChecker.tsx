// TODO: make this component the actual design pattern checker; for now it just
// displays the ASG nodes and edges
import {
  Alert,
  Box,
  CircularProgress,
  Container,
  Typography,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { getCodebaseASG } from "../api/designPatterns.api";

const DesignPatternChecker = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["codebaseASG"],
    queryFn: getCodebaseASG,
  });

  if (isLoading) return <CircularProgress sx={{ m: 4 }} />;

  if (error) {
    return <Alert severity="error">Failed to load codebase ASG.</Alert>;
  }

  const nodes: Record<string, string>[] = data?.nodes ?? [];
  const edges: Record<string, string>[] = data?.edges ?? [];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" fontWeight="800" gutterBottom>
        Design Pattern Checker
      </Typography>

      <Typography variant="h6">Nodes ({nodes.length})</Typography>
      <Box component="ul" sx={{ fontFamily: "monospace", fontSize: 13 }}>
        {nodes.map((node) => (
          <li key={`${node.type}:${node.fqn}`}>
            {node.type}: {node.fqn}
          </li>
        ))}
      </Box>

      <Typography variant="h6">Edges ({edges.length})</Typography>
      <Box component="ul" sx={{ fontFamily: "monospace", fontSize: 13 }}>
        {edges.map((edge, i) => {
          const { type, ...rest } = edge;

          return (
            <li key={i}>
              {type}: {Object.values(rest).join(" -> ")}
            </li>
          );
        })}
      </Box>
    </Container>
  );
};

export default DesignPatternChecker;
