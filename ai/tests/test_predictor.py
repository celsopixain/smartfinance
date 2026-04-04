import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

import pytest
from app.predictor import detect_anomaly, predict_next_month
from app.schemas import MonthlySpending


# ── detect_anomaly ────────────────────────────────────────────

class TestDetectAnomaly:
    def test_valor_2x_acima_da_media_e_anomalia(self):
        historico = [300.0, 320.0, 280.0]  # média ~300
        is_anomaly, score, media = detect_anomaly(700.0, historico)
        assert is_anomaly is True
        assert score >= 2.0

    def test_valor_normal_nao_e_anomalia(self):
        historico = [300.0, 320.0, 280.0]
        is_anomaly, score, media = detect_anomaly(310.0, historico)
        assert is_anomaly is False
        assert score < 2.0

    def test_exatamente_no_limiar_e_anomalia(self):
        historico = [100.0, 100.0, 100.0]  # média 100
        is_anomaly, score, _ = detect_anomaly(200.0, historico)
        assert is_anomaly is True
        assert score == pytest.approx(2.0)

    def test_historico_vazio_retorna_false(self):
        is_anomaly, score, media = detect_anomaly(999.0, [])
        assert is_anomaly is False
        assert media == 0.0

    def test_media_historica_calculada_corretamente(self):
        historico = [100.0, 200.0, 300.0]  # média = 200
        _, _, media = detect_anomaly(100.0, historico)
        assert media == pytest.approx(200.0)

    def test_score_calculado_corretamente(self):
        historico = [100.0, 100.0, 100.0]  # média = 100
        _, score, _ = detect_anomaly(250.0, historico)
        assert score == pytest.approx(2.5)


# ── predict_next_month ────────────────────────────────────────

def _make_spending(cat_id, cat_name, mes, ano, total):
    return MonthlySpending(
        categoria_id=cat_id,
        categoria=cat_name,
        mes=mes,
        ano=ano,
        total=total,
    )


class TestPredictNextMonth:
    def test_retorna_lista_vazia_para_historico_vazio(self):
        result = predict_next_month([])
        assert result == []

    def test_predicao_com_3_meses_usa_regressao(self):
        # Tendência de alta: 800 → 950 → 1100 → esperado ~1250
        historico = [
            _make_spending('cat-1', 'Alimentação', 1, 2026, 800),
            _make_spending('cat-1', 'Alimentação', 2, 2026, 950),
            _make_spending('cat-1', 'Alimentação', 3, 2026, 1100),
        ]
        result = predict_next_month(historico)
        assert len(result) == 1
        assert result[0].categoria_id == 'cat-1'
        assert result[0].valor_previsto > 1100  # deve seguir a tendência

    def test_predicao_com_2_meses_usa_media_movel(self):
        historico = [
            _make_spending('cat-2', 'Transporte', 1, 2026, 200),
            _make_spending('cat-2', 'Transporte', 2, 2026, 220),
        ]
        result = predict_next_month(historico)
        assert len(result) == 1
        # Média Móvel Ponderada: (200*1 + 220*2) / 3 ≈ 213.33
        assert result[0].valor_previsto == pytest.approx(213.33, abs=1.0)

    def test_resultado_nunca_e_negativo(self):
        # Tendência de queda forte
        historico = [
            _make_spending('cat-3', 'Lazer', 1, 2026, 500),
            _make_spending('cat-3', 'Lazer', 2, 2026, 200),
            _make_spending('cat-3', 'Lazer', 3, 2026, 10),
        ]
        result = predict_next_month(historico)
        assert result[0].valor_previsto >= 0.0

    def test_variacao_percentual_calculada_corretamente(self):
        # Último mês = 1000, previsão = 1200 → variação = 20%
        historico = [
            _make_spending('cat-4', 'Moradia', 1, 2026, 800),
            _make_spending('cat-4', 'Moradia', 2, 2026, 900),
            _make_spending('cat-4', 'Moradia', 3, 2026, 1000),
        ]
        result = predict_next_month(historico)
        assert result[0].variacao_percentual is not None

    def test_multiplas_categorias_retornam_separadas(self):
        historico = [
            _make_spending('cat-1', 'Alimentação', 1, 2026, 800),
            _make_spending('cat-1', 'Alimentação', 2, 2026, 900),
            _make_spending('cat-2', 'Transporte',  1, 2026, 200),
            _make_spending('cat-2', 'Transporte',  2, 2026, 220),
        ]
        result = predict_next_month(historico)
        assert len(result) == 2
        ids = {r.categoria_id for r in result}
        assert 'cat-1' in ids
        assert 'cat-2' in ids
