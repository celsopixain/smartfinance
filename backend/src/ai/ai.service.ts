import { Injectable, Logger } from '@nestjs/common'
import { HttpService } from '@nestjs/axios'
import { firstValueFrom } from 'rxjs'

interface AnomalyResult {
  is_anomaly: boolean
  score: number
  media_historica: number
}

interface PredictResult {
  categoria_id: string
  categoria: string
  valor_previsto: number
  variacao_percentual: number | null
}

interface PredictResponse {
  user_id: string
  predicoes: PredictResult[]
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name)
  private readonly aiUrl: string

  constructor(private readonly http: HttpService) {
    this.aiUrl = process.env.AI_SERVICE_URL ?? 'http://localhost:8000'
  }

  async checkAnomaly(
    userId: string,
    categoriaId: string,
    valor: number,
    historicoValores: number[],
  ): Promise<AnomalyResult> {
    try {
      const { data } = await firstValueFrom(
        this.http.post<AnomalyResult>(`${this.aiUrl}/anomaly`, {
          user_id: userId,
          categoria_id: categoriaId,
          valor,
          historico_valores: historicoValores,
        }),
      )
      return data
    } catch (err) {
      // Falha silenciosa — não bloqueia a criação da transação
      this.logger.warn(`AI anomaly check falhou: ${(err as Error).message}`)
      return { is_anomaly: false, score: 1.0, media_historica: 0 }
    }
  }

  async predict(
    userId: string,
    historico: {
      categoria_id: string
      categoria: string
      mes: number
      ano: number
      total: number
    }[],
  ): Promise<PredictResponse> {
    const { data } = await firstValueFrom(
      this.http.post<PredictResponse>(`${this.aiUrl}/predict`, {
        user_id: userId,
        historico,
      }),
    )
    return data
  }
}
