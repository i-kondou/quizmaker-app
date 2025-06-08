import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { QuizData } from "../types";
import {
  fetchRandomQuizSetAPI,
  fetchQuizzesByHeritageIdAPI,
} from "../services/api";

const QUIZ_COUNT_OPTIONS = [
  { value: "5", label: "5問" },
  { value: "10", label: "10問" },
  { value: "20", label: "20問" },
];
const DEFAULT_QUIZ_COUNT = "10";

const QuizChallengePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const modeQueryParam = searchParams.get("mode"); // 'random' or null
  const heritageIdQueryParam = searchParams.get("heritageId"); // 遺産ID or null

  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [quizzes, setQuizzes] = useState<QuizData[]>([]);
  const [isLoading, setIsLoading] = useState(true); // 初期表示はローディングを考慮
  const [error, setError] = useState<string | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const [quizCount, setQuizCount] = useState<string>(DEFAULT_QUIZ_COUNT);
  const [challengeMode, setChallengeMode] = useState<
    "allRandom" | "heritageSpecific" | "initial"
  >("initial");
  const [isQuizStarted, setIsQuizStarted] = useState<boolean>(false);

  // 1. URLクエリパラメータからクイズモードと初期開始状態を決定するuseEffect
  useEffect(() => {
    const idNum = heritageIdQueryParam
      ? parseInt(heritageIdQueryParam, 10)
      : NaN;

    if (heritageIdQueryParam && !isNaN(idNum)) {
      console.log(
        "useEffect[params]: Setting mode to heritageSpecific and starting quiz."
      );
      setChallengeMode("heritageSpecific");
      setIsQuizStarted(true); // 特定遺産クイズはすぐに開始
      setIsLoading(true); // データ取得開始の準備
    } else if (modeQueryParam === "random") {
      console.log(
        "useEffect[params]: Setting mode to allRandom, quiz not started yet (waiting for count selection)."
      );
      setChallengeMode("allRandom");
      setIsQuizStarted(false); // ランダムクイズは問題数選択後に開始
      setIsLoading(false); // 設定画面を表示するのでローディングは一旦解除
    } else {
      console.log("useEffect[params]: Invalid mode or params. Setting error.");
      setError("クイズのモードが正しく指定されていないか、URLが無効です。");
      setChallengeMode("initial");
      setIsQuizStarted(false);
      setIsLoading(false);
    }
  }, [heritageIdQueryParam, modeQueryParam]); // URLのクエリパラメータにのみ依存

  // クイズデータを取得する処理
  const loadQuizzes = useCallback(async () => {
    // isQuizStarted が false の場合 (特にランダムモードで「クイズ開始」前) はロードしない
    if (!isQuizStarted) {
      console.log("loadQuizzes: Quiz not started, skipping load.");
      setIsLoading(false); // ローディング状態を確実に解除
      return;
    }
    // challengeMode が initial の場合もロードしない
    if (challengeMode === "initial") {
      console.log("loadQuizzes: Challenge mode is initial, skipping load.");
      setIsLoading(false);
      return;
    }

    console.log(
      `loadQuizzes: Starting to load quizzes for mode: ${challengeMode}`
    );
    setIsLoading(true);
    setError(null);
    setQuizzes([]); // 前回のをクリア
    setCurrentQuizIndex(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setIsCorrect(null);
    setScore(0);

    try {
      let fetchedQuizzes: QuizData[] = [];
      if (challengeMode === "heritageSpecific" && heritageIdQueryParam) {
        const idNum = parseInt(heritageIdQueryParam, 10); // 再度パースするが、最初のuseEffectでチェック済み
        if (!isNaN(idNum)) {
          console.log(
            `loadQuizzes: Fetching quizzes for specific heritageId: ${idNum}`
          );
          fetchedQuizzes = await fetchQuizzesByHeritageIdAPI(idNum);
        } else {
          throw new Error("無効な遺産IDです。");
        } // 通常ここには来ない
      } else if (challengeMode === "allRandom") {
        const count = parseInt(quizCount, 10);
        if (!isNaN(count) && count > 0) {
          console.log(
            `loadQuizzes: Fetching ${count} random quizzes for challenge.`
          );
          fetchedQuizzes = await fetchRandomQuizSetAPI(count);
        } else {
          throw new Error("問題数が無効です。");
        }
      } else {
        // このケースは最初のuseEffectでエラーになっているはず
        console.warn(
          "loadQuizzes: Unexpected challengeMode or missing params."
        );
        setIsLoading(false);
        return;
      }

      if (fetchedQuizzes && fetchedQuizzes.length > 0) {
        const shuffledQuizzes = fetchedQuizzes.map((quiz) => ({
          ...quiz,
          options: [...quiz.options].sort(() => 0.5 - Math.random()),
        }));
        setQuizzes(shuffledQuizzes);
        console.log("loadQuizzes: Quizzes loaded and set.", shuffledQuizzes);
      } else {
        setError("挑戦できるクイズが見つかりませんでした。");
        console.log("loadQuizzes: No quizzes found.");
      }
    } catch (err: any) {
      console.error("loadQuizzes: Failed to fetch quizzes:", err);
      setError(err.message || "クイズの読み込みに失敗しました。");
    } finally {
      setIsLoading(false);
      console.log("loadQuizzes: Loading finished.");
    }
  }, [challengeMode, heritageIdQueryParam, quizCount, isQuizStarted]); // isQuizStarted を依存配列に追加
  // 2. challengeMode または isQuizStarted が変更されたらクイズをロードするuseEffect
  useEffect(() => {
    console.log(
      `useEffect[loadTrigger]: challengeMode=${challengeMode}, isQuizStarted=${isQuizStarted}`
    );
    if (challengeMode !== "initial" && isQuizStarted) {
      loadQuizzes();
    }
  }, [challengeMode, isQuizStarted, loadQuizzes]); // quizCount は loadQuizzes の依存配列に入っているので不要

  const handleStartRandomQuiz = () => {
    if (challengeMode === "allRandom") {
      // modeQueryParam ではなく challengeMode を確認
      console.log("handleStartRandomQuiz: Setting isQuizStarted to true.");
      setIsQuizStarted(true); // これにより上記のuseEffectが発火し、loadQuizzesが呼ばれる
    } else {
      setError("ランダムクイズモードではありません。");
    }
  };

  const currentQuiz = quizzes[currentQuizIndex];

  const handleAnswerSelect = (option: string) => {
    if (showResult || !currentQuiz) return;
    setSelectedAnswer(option);
    const correct = option === currentQuiz.answer;
    setIsCorrect(correct);
    if (correct) {
      setScore((prev) => prev + 1);
    }
    setShowResult(true);
    setTimeout(() => {
      handleNextQuiz();
    }, 1500);
  };

  const handleNextQuiz = () => {
    setShowResult(false);
    setSelectedAnswer(null);
    setIsCorrect(null);
    if (currentQuizIndex < quizzes.length - 1) {
      setCurrentQuizIndex((prev) => prev + 1);
    } else {
      alert(`クイズ終了！あなたのスコアは ${score} / ${quizzes.length} です。`);
      navigate("/heritages");
    }
  };

  // --- レンダリングロジック ---

  if (challengeMode === "allRandom" && !isQuizStarted && !isLoading && !error) {
    return (
      <div className="container mx-auto p-4 flex flex-col items-center space-y-6">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-2xl">
              クイズに挑戦！
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Label className="mb-2 block text-center font-medium">
              挑戦する問題数を選択してください:
            </Label>
            <RadioGroup
              defaultValue={DEFAULT_QUIZ_COUNT}
              onValueChange={setQuizCount}
              className="flex justify-center space-x-4"
            >
              {QUIZ_COUNT_OPTIONS.map((opt) => (
                <div key={opt.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={opt.value} id={`count-${opt.value}`} />
                  <Label htmlFor={`count-${opt.value}`}>{opt.label}</Label>
                </div>
              ))}
            </RadioGroup>
            <Button
              onClick={handleStartRandomQuiz}
              className="w-full mt-6 text-lg p-6"
            >
              クイズ開始
            </Button>
          </CardContent>
        </Card>
        <Button variant="link" onClick={() => navigate("/heritages")}>
          一覧に戻る
        </Button>
      </div>
    );
  }

  // 2. ローディング中
  if (isLoading) {
    return (
      <div className="container mx-auto p-4 flex justify-center items-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  // 3. エラー発生時
  if (error) {
    return (
      <div className="container mx-auto p-4 text-center">
        <p className="text-xl text-red-500 mb-4">{error}</p>
        <Button
          onClick={() => {
            if (challengeMode === "allRandom" && !heritageIdQueryParam) {
              // heritageIdParamがないランダムモード
              setIsQuizStarted(false); // 設定画面に戻る
              setError(null); // エラーもクリア
            } else {
              navigate("/heritages"); // 特定遺産モードまたはエラーが解決不能な場合
            }
          }}
        >
          {challengeMode === "allRandom" && !heritageIdQueryParam
            ? "設定に戻る"
            : "一覧に戻る"}
        </Button>
      </div>
    );
  }

  // 4. クイズデータがない場合 (ロード後でエラーなし)
  if (!currentQuiz) {
    return (
      <div className="container mx-auto p-4 text-center">
        <p className="text-xl text-muted-foreground">
          挑戦できるクイズが見つかりませんでした。
        </p>
        <Button
          onClick={() => {
            if (challengeMode === "allRandom" && !heritageIdQueryParam) {
              setIsQuizStarted(false);
              setError(null);
            } else {
              navigate("/heritages");
            }
          }}
          className="mt-4"
        >
          {challengeMode === "allRandom" && !heritageIdQueryParam
            ? "設定に戻る"
            : "一覧に戻る"}
        </Button>
      </div>
    );
  }

  // 5. クイズ挑戦中
  return (
    <div className="container mx-auto p-4 flex flex-col items-center space-y-6">
      <Card className="w-full max-w-2xl shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">
            世界遺産クイズ ({currentQuizIndex + 1} / {quizzes.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-lg font-medium text-center min-h-[6em] flex items-center justify-center p-4 bg-muted rounded-md">
            {currentQuiz.question}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {currentQuiz.options.map((option, index) => {
              // ... (選択肢ボタンのロジックは変更なし) ...
              const isSelected = selectedAnswer === option;
              const isAnswer = option === currentQuiz.answer;
              let buttonVariant:
                | "default"
                | "secondary"
                | "outline"
                | "destructive" = "outline";
              let icon = null;
              if (showResult) {
                if (isAnswer) {
                  buttonVariant = "default";
                  icon = <CheckCircle className="mr-2 h-5 w-5 text-white" />;
                } else if (isSelected && !isAnswer) {
                  buttonVariant = "destructive";
                  icon = <XCircle className="mr-2 h-5 w-5 text-white" />;
                }
              } else if (isSelected) {
                buttonVariant = "secondary";
              }
              return (
                <Button
                  key={index}
                  variant={buttonVariant}
                  className={`p-6 ... ${
                    showResult && isAnswer ? "bg-green-500 ..." : ""
                  } ...`}
                  onClick={() => handleAnswerSelect(option)}
                  disabled={showResult}
                >
                  {" "}
                  {icon} {option}{" "}
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>
      <Button
        variant="link"
        onClick={() => navigate("/heritages")}
        className="mt-8"
      >
        クイズをやめる
      </Button>
    </div>
  );
};

export default QuizChallengePage;
