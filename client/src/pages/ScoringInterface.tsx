import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import QuestionPanel from "@/components/QuestionPanel";
import StudentResponseCard from "@/components/StudentResponseCard";
import { TeacherScore, QuestionData, ScoringStats } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Save,
  AlertTriangle,
  ArrowRight,
  Upload,
  FileWarning,
  Check,
  Info,
} from "lucide-react";
import { parseCSV } from "@/lib/csvParser";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";

const ScoringInterface = () => {
  const { toast } = useToast();

  // State for info dialog
  const [isInfoDialogOpen, setInfoDialogOpen] = useState(false);


  const isLoading = false;
  const isError = false;

  // States
  const [teacherScores, setTeacherScores] = useState<TeacherScore[]>([]);
  const [expandedStudents, setExpandedStudents] = useState<
    Record<number, boolean>
  >({});
  const [activeSimilarResponses, setActiveSimilarResponses] = useState<
    number | null
  >(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [customData, setCustomData] = useState<QuestionData[]>([]);
  const currentQuestion = customData[currentQuestionIndex];
  const [stats, setStats] = useState<ScoringStats>({
    totalStudents: 0,
    scoredStudents: 0,
    pendingStudents: 0,
  });

  // Initialize teacher scores when data loads
  useEffect(() => {
    if (currentQuestion) {
      // Initialize all teacher scores with empty values
      const initialScores = currentQuestion.studentResponses.map(() => ({
        part1: "",
        part2: "",
        total: "",
      }));
      setTeacherScores(initialScores);

      setStats({
        totalStudents: currentQuestion.studentResponses.length,
        scoredStudents: 0,
        pendingStudents: currentQuestion.studentResponses.length,
      });
    }
  }, [currentQuestion]);

  // Calculate scoring statistics
  useEffect(() => {
    if (currentQuestion && teacherScores.length > 0) {
      const scoredCount = teacherScores.filter(
        (score) => score.total !== "",
      ).length;

      setStats({
        totalStudents: currentQuestion.studentResponses.length,
        scoredStudents: scoredCount,
        pendingStudents: currentQuestion.studentResponses.length - scoredCount,
      });
    }
  }, [teacherScores, currentQuestion]);

  // Score input handler
  const handleScoreChange = (
    studentId: number,
    part: "part1" | "part2" | "total",
    score: string | number,
  ) => {
    if (!currentQuestion) return;

    const newScores = [...teacherScores];
    const studentIndex = currentQuestion.studentResponses.findIndex(
      (s) => s.id === studentId,
    );

    if (studentIndex !== -1) {
      // Behoud bestaande scores voor andere delen
      const currentScore = newScores[studentIndex] || {
        part1: "",
        part2: "",
        total: "",
      };

      // Update alleen het specifieke deel
      newScores[studentIndex] = {
        ...currentScore,
        [part]: score,
      };

      // Als we een specifiek deel hebben bijgewerkt, update dan mogelijk ook de totaalscore
      if (part === "part1" || part === "part2") {
        const otherPart = part === "part1" ? "part2" : "part1";
        const otherScore = currentScore[otherPart];

        // Als beide deel-scores nu ingevuld zijn, bereken dan automatisch de totaalscore
        if (score !== "" && otherScore !== "") {
          const part1Value =
            part === "part1" ? Number(score) : Number(otherScore);
          const part2Value =
            part === "part2" ? Number(score) : Number(otherScore);
          newScores[studentIndex].total = part1Value + part2Value;
        }
      }

      setTeacherScores(newScores);

      console.log(`Changed ${studentId} ${part} score to ${score}`);
    }
  };

  // Toggle explanation for a student
  const toggleExplanation = (studentId: number) => {
    setExpandedStudents({
      ...expandedStudents,
      [studentId]: !expandedStudents[studentId],
    });

    // Close similar responses when toggling
    if (activeSimilarResponses === studentId) {
      setActiveSimilarResponses(null);
    }
  };

  // Toggle similar responses
  const toggleSimilarResponses = (studentId: number) => {
    setActiveSimilarResponses(
      activeSimilarResponses === studentId ? null : studentId,
    );
  };


  // Functie om naar de volgende vraag te gaan
  const handleNextQuestion = () => {
    // Ga naar de volgende vraag als er nog meer vragen zijn
    if (currentQuestionIndex < customData.length - 1) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      setCurrentQuestionIndex((prevIndex) => prevIndex + 1);

      // Reset de scores voor de nieuwe vraag
      setTeacherScores([]);

      // Reset expandedStudents en activeSimilarResponses
      setExpandedStudents({});
      setActiveSimilarResponses(null);

      // Update de data met de nieuwe vraag

    } else {
      toast({
        title: "Einde bereikt",
        description: "Dit was de laatste vraag",
      });
    }
  };

  // Save all scores
  const handleSaveScores = async () => {
    try {
      if (!currentQuestion) return;

      const scores = teacherScores.map((score, index) => ({
        studentId: currentQuestion.studentResponses[index].id,
        score,
      }));


      toast({
        title: "Scores opgeslagen",
        description: "Alle scores zijn succesvol opgeslagen in uw browser.",
      });

    } catch (error) {
      toast({
        title: "Fout bij opslaan",
        description:
          "Er is een probleem opgetreden bij het opslaan van de scores. Probeer het opnieuw.",
        variant: "destructive",
      });
      console.error(error);
    }
  };

  // Submit all scores
  const handleSubmitScores = async () => {
    try {
      if (!currentQuestion) return;

      const scores = teacherScores.map((score, index) => ({
        studentId: currentQuestion.studentResponses[index].id,
        score,
      }));

      toast({
        title: "Scores ingediend",
        description: "Alle scores zijn succesvol ingediend in uw browser.",
      });

    } catch (error) {
      toast({
        title: "Fout bij indienen",
        description:
          "Er is een probleem opgetreden bij het indienen van de scores. Probeer het opnieuw.",
        variant: "destructive",
      });
      console.error(error);
    }
  };

  // Accept all AI scores
  const handleAcceptAIScores = () => {
    if (!currentQuestion) return;

    const newScores = currentQuestion.studentResponses.map((student) => ({
      part1: student.aiScore.part1,
      part2: student.aiScore.part2,
      total: student.aiScore.total,
    }));

    setTeacherScores(newScores);

    toast({
      title: "AI-scores overgenomen",
      description: "Alle AI-scores zijn overgenomen als uw beoordelingen.",
    });
  };

  // Handle CSV upload
  const handleCSVUpload = async (file: File) => {
    try {
      const reader = new FileReader();

      reader.onload = (e) => {
        const csvContent = e.target?.result as string;
        if (!csvContent) {
          toast({
            title: "Fout bij inlezen",
            description: "Het CSV-bestand kon niet worden ingelezen.",
            variant: "destructive",
          });
          return;
        }

        try {
          // Parse CSV content
          const parsedData = parseCSV(csvContent);

          // Update state with the new data
          setCustomData(parsedData);

          // Initialize teacher scores
          if(parsedData.length > 0){
            const initialScores = parsedData[0].studentResponses.map(() => ({
              part1: "",
              part2: "",
              total: "",
            }));
            setTeacherScores(initialScores);
          }

          // Reset expanded state
          setExpandedStudents({});

          // Update stats
          if(parsedData.length > 0){
            setStats({
              totalStudents: parsedData[0].studentResponses.length,
              scoredStudents: 0,
              pendingStudents: parsedData[0].studentResponses.length,
            });
          }

          toast({
            title: "CSV succesvol ingelezen",
            description: `${parsedData.length > 0 ? parsedData[0].studentResponses.length : 0} leerlingantwoorden geladen.`,
          });
        } catch (error) {
          console.error("Error parsing CSV:", error);
          toast({
            title: "Fout bij verwerken CSV",
            description:
              "Het CSV-bestand heeft niet het juiste formaat. Controleer uw bestand.",
            variant: "destructive",
          });
        }
      };

      reader.onerror = () => {
        toast({
          title: "Fout bij inlezen",
          description:
            "Er is een fout opgetreden bij het inlezen van het bestand.",
          variant: "destructive",
        });
      };

      reader.readAsText(file);
    } catch (error) {
      console.error("Error processing file:", error);
      toast({
        title: "Fout bij verwerken",
        description:
          "Er is een fout opgetreden bij het verwerken van het bestand.",
        variant: "destructive",
      });
    }
  };

  // Calculate progress percentage
  const progressPercentage =
    stats.totalStudents > 0
      ? Math.round((stats.scoredStudents / stats.totalStudents) * 100)
      : 0;

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Beoordelingsinterface laden...</p>
        </div>
      </div>
    );
  }

  if (isError || !currentQuestion) {
    return (
      <div className="container mx-auto p-4 flex items-center justify-center min-h-screen">
        <div className="text-center bg-white p-6 rounded-lg shadow-md max-w-md">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold mb-2">
            Fout bij het laden van data
          </h2>
          <p className="text-gray-600 mb-4">
            De beoordelingsinterface kon niet worden geladen. Vernieuw de pagina
            of upload een CSV-bestand met beoordelingsgegevens.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={() => window.location.reload()}>
              Pagina vernieuwen
            </Button>
            <label className="cursor-pointer bg-primary hover:bg-primary/90 text-white rounded-md px-3 py-2 text-sm flex items-center gap-1 hover:shadow-sm transition-all">
              <input
                type="file"
                accept=".csv"
                className="sr-only"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleCSVUpload(file);
                  }
                }}
              />
              <Upload className="h-4 w-4" /> CSV importeren
            </label>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-7xl bg-gray-50 min-h-screen">
      {/* Header */}
      <header className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <h1 className="text-2xl font-bold text-gray-800">
            Nakijken met behulp van AI
          </h1>
          <div className="flex space-x-2">
            <label className="relative cursor-pointer bg-white hover:bg-gray-50 border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-700 flex items-center gap-1 hover:shadow-sm transition-all">
              <input
                type="file"
                accept=".csv"
                className="sr-only"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleCSVUpload(file);
                  }
                }}
              />
              <Upload className="h-4 w-4" /> CSV importeren
            </label>

            <div className="relative group">
              <Button
                variant="outline"
                className="flex items-center gap-1 text-sm h-9"
              >
                <FileWarning className="h-4 w-4" /> CSV help
              </Button>
              <div className="absolute z-50 hidden group-hover:block bg-white border rounded-md shadow-lg p-3 w-64 right-0 mt-1">
                <div className="text-sm mb-2">Download voorbeeldbestanden:</div>
                <div className="flex flex-col gap-2">
                  <a
                    href="example.csv" // Replace with actual file path
                    className="text-xs text-primary hover:underline flex items-center gap-1"
                    download
                  >
                    <FileWarning className="h-3 w-3" /> Voorbeeld CSV bestand
                  </a>
                  <a
                    href="instructions.txt" // Replace with actual file path
                    className="text-xs text-primary hover:underline flex items-center gap-1"
                    download
                  >
                    <FileWarning className="h-3 w-3" /> CSV formaat instructies
                  </a>
                </div>
              </div>
            </div>
            {/* Add the "i" button here */}
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setInfoDialogOpen(true)}
                >
                  <Info className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent
                open={isInfoDialogOpen}
                onOpenChange={setInfoDialogOpen}
              >
                <h3 className="text-lg font-semibold">Extra Informatie</h3>
                <p>Deze tool geeft AI score-suggesties op basis van:</p>
                <ul className="list-disc list-inside mb-4">
                  <li>
                    De vergelijkbaarbeid van een leerlingantwoord met het
                    antwoordmodel.
                  </li>
                  <li>De voorheen gescoorde leerlingantwoorden.</li>
                </ul>
                <p>De 'Waarom?' knop toont:</p>
                <ul className="list-disc list-inside">
                  <li>
                    De woorden die (veel) hebben bijgedragen aan de AI score.
                  </li>
                  <li>
                    Hoe zeker de AI is van een score suggestie, uitgedrukt in
                    een betrouwbaarheidspercentage.
                  </li>
                  <li>
                    Een knop om vergelijkbare leerlingantwoorden te tonen, die
                    al een score hebben gekregen (van jou of een collega
                    docent).
                  </li>
                </ul>
                <DialogClose asChild>
                  <Button variant="outline">Sluiten</Button>
                </DialogClose>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-1">
          <div className="text-sm text-gray-500">
            <span className="mr-2">
              Opdracht: {currentQuestion?.assignmentName || "Onbekend"}
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full mt-2">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Voortgang vraagbeoordelingen</span>
            <span>{currentQuestionIndex + 1}/{customData.length} voltooid</span>
          </div>
          <Progress
            value={((currentQuestionIndex + 1) / customData.length) * 100}
            className="h-2"
          />
        </div>
      </header>

      {/* Main Content */}
      <div className="grid grid-cols-12 gap-6">
        {/* Left Column - Fixed Question and Model Answer */}
        <QuestionPanel
          question={currentQuestion?.question}
          modelAnswer={currentQuestion?.modelAnswer}
        />

        {/* Right Column - Scrollable Student Responses */}
        <div className="col-span-12 md:col-span-8 space-y-6 max-h-screen overflow-y-auto pr-2">
          {currentQuestion?.studentResponses.map((student, studentIndex) => (
            <StudentResponseCard
              key={student.id}
              student={student}
              teacherScore={teacherScores[studentIndex]}
              isExpanded={!!expandedStudents[student.id]}
              showSimilarResponses={activeSimilarResponses === student.id}
              onScoreChange={handleScoreChange}
              onToggleExplanation={() => toggleExplanation(student.id)}
              onToggleSimilarResponses={() =>
                toggleSimilarResponses(student.id)
              }
            />
          ))}
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="mt-8 flex justify-end gap-4 pb-8">
        {currentQuestionIndex > 0 && (
          <Button
            onClick={() => {
              window.scrollTo({ top: 0, behavior: "smooth" });
              setCurrentQuestionIndex((prevIndex) => {
                const newIndex = prevIndex - 1;

                // Update de data met de vorige vraag

                // Reset de scores voor de vorige vraag
                setTeacherScores([]);

                // Reset expandedStudents en activeSimilarResponses
                setExpandedStudents({});
                setActiveSimilarResponses(null);

                toast({
                  title: "Navigatie",
                  description: `Je gaat terug naar vraag ${newIndex + 1}`,
                });

                return newIndex;
              });
            }}
            className="flex items-center gap-1 bg-secondary text-white shadow-lg hover:shadow-xl transition-shadow rounded-full px-6 py-6 h-auto"
            size="lg"
          >
            <ArrowRight className="h-5 w-5 mr-1 rotate-180" /> Vorige
          </Button>
        )}

        <Button
          onClick={handleNextQuestion}
          className="flex items-center gap-1 bg-primary text-white shadow-lg hover:shadow-xl transition-shadow rounded-full px-6 py-6 h-auto"
          size="lg"
        >
          Volgende vraag <ArrowRight className="h-5 w-5 ml-1" />
        </Button>
      </div>
    </div>
  );
};

export default ScoringInterface;