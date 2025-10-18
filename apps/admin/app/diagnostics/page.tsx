import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PathValidator } from "@/components/path-validator";
import { ComfyUIMonitor } from "@/components/comfyui-monitor";

export default function DiagnosticsPage() {
	return (
		<div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
			<div className="container mx-auto px-4 py-8">
				<div className="mb-6">
					<h1 className="text-2xl font-semibold">Diagnostics</h1>
					<p className="text-sm text-muted-foreground">Быстрая проверка окружения: пути и статус ComfyUI</p>
				</div>

								<div className="grid gap-4 md:grid-cols-2">
									<PathValidator />
									<ComfyUIMonitor />
								</div>

				<div className="mt-6">
					<Card>
						<CardHeader>
							<CardTitle className="text-base">Примечание</CardTitle>
						</CardHeader>
						<CardContent className="text-sm text-muted-foreground">
							Данные берутся из файла paths.json в корне проекта и из API ComfyUI.
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}
