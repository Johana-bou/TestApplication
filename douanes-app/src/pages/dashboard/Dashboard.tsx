// src/pages/dashboard/Dashboard.tsx
import { useQuery } from "@tanstack/react-query";
import ReactApexChart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import { useAuth } from "../../hooks/useAuth";
import { getRapportTableau } from "../../api/rapports.api";
import { getEtatsNominatifs } from "../../api/etat-nominatif.api";
import { getRapprochements } from "../../api/rapprochement.api";
import { formatMontant, formatMontantCourt } from "../../utils/formatMontant";
import { getPeriode } from "../../utils/periodes";
import { Spinner } from "../../components/ui/Spinner";
import { useState, useEffect } from "react";

interface RapportUnite {
  id_unite: number;
  nom_unite: string;
  montants_par_mois: Record<number, number>;
  total: number;
}

const MOIS_LABELS = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"];
const MOIS_NOMS = ["janvier","février","mars","avril","mai","juin","juillet","août","septembre","octobre","novembre","décembre"];
const JOURS = ["Dimanche","Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi"];

function aggregateMonthlyTotals(data: RapportUnite[] | undefined): number[] {
  if (!data) return Array(12).fill(0);
  const monthly = Array(12).fill(0);
  for (const unite of data) {
    for (const [moisStr, montant] of Object.entries(unite.montants_par_mois)) {
      const idx = parseInt(moisStr) - 1;
      if (idx >= 0 && idx < 12) monthly[idx] += montant;
    }
  }
  return monthly;
}

function computeGrandTotal(data: RapportUnite[] | undefined): number {
  if (!data) return 0;
  return data.reduce((sum, u) => sum + (u.total || 0), 0);
}

// ── Horloge analogique ────────────────────────────────────────────────────────
function AnalogClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const s = time.getSeconds();
  const m = time.getMinutes();
  const h = time.getHours() % 12;
  const secDeg  = s * 6;
  const minDeg  = m * 6 + s * 0.1;
  const hourDeg = h * 30 + m * 0.5;

  const pad = (n: number) => String(n).padStart(2, '0');
  const digital = `${pad(time.getHours())}:${pad(m)}:${pad(s)}`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <svg width="110" height="110" viewBox="0 0 110 110">
        {/* Fond */}
        <circle cx="55" cy="55" r="52" fill="#f8f9fa" stroke="#0d6b29" strokeWidth="2.5"/>
        <circle cx="55" cy="55" r="48" fill="#fff"/>
        {/* Graduations */}
        {Array.from({length: 60}).map((_, i) => {
          const angle = (i * 6 - 90) * Math.PI / 180;
          const isMaj = i % 5 === 0;
          const r1 = isMaj ? 40 : 44;
          const r2 = 47;
          return (
            <line key={i}
              x1={55 + r1 * Math.cos(angle)} y1={55 + r1 * Math.sin(angle)}
              x2={55 + r2 * Math.cos(angle)} y2={55 + r2 * Math.sin(angle)}
              stroke={isMaj ? '#0d6b29' : '#ccc'}
              strokeWidth={isMaj ? 2 : 1}
            />
          );
        })}
        {/* Chiffres */}
        {[12,3,6,9].map((n, i) => {
          const angle = (i * 90 - 90) * Math.PI / 180;
          return (
            <text key={n}
              x={55 + 35 * Math.cos(angle)}
              y={55 + 35 * Math.sin(angle) + 4}
              textAnchor="middle" fill="#0d6b29" fontSize="8" fontWeight="bold">
              {n}
            </text>
          );
        })}
        {/* Aiguille heures */}
        <line
          x1="55" y1="55"
          x2={55 + 22 * Math.sin(hourDeg * Math.PI / 180)}
          y2={55 - 22 * Math.cos(hourDeg * Math.PI / 180)}
          stroke="#353535" strokeWidth="3.5" strokeLinecap="round"
        />
        {/* Aiguille minutes */}
        <line
          x1="55" y1="55"
          x2={55 + 32 * Math.sin(minDeg * Math.PI / 180)}
          y2={55 - 32 * Math.cos(minDeg * Math.PI / 180)}
          stroke="#0d6b29" strokeWidth="2.5" strokeLinecap="round"
        />
        {/* Aiguille secondes */}
        <line
          x1="55" y1="55"
          x2={55 + 36 * Math.sin(secDeg * Math.PI / 180)}
          y2={55 - 36 * Math.cos(secDeg * Math.PI / 180)}
          stroke="#e53e3e" strokeWidth="1.5" strokeLinecap="round"
        />
        {/* Contre-aiguille secondes */}
        <line
          x1="55" y1="55"
          x2={55 - 10 * Math.sin(secDeg * Math.PI / 180)}
          y2={55 + 10 * Math.cos(secDeg * Math.PI / 180)}
          stroke="#e53e3e" strokeWidth="1.5" strokeLinecap="round"
        />
        {/* Centre */}
        <circle cx="55" cy="55" r="4" fill="#353535"/>
        <circle cx="55" cy="55" r="2" fill="#e53e3e"/>
      </svg>
      {/* Affichage digital */}
      <div style={{
        fontFamily: 'monospace', fontSize: 16, fontWeight: 700,
        color: '#0d6b29', letterSpacing: 2,
      }}>
        {digital}
      </div>
      <div style={{ fontSize: 11, color: '#888' }}>
        {JOURS[time.getDay()]} {time.getDate()} {MOIS_NOMS[time.getMonth()]} {time.getFullYear()}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user, poste, isAdmin } = useAuth();
  const today = new Date();
  const periodeAnnee = getPeriode("annee");

  // ── États nominatifs ──────────────────────────────────────────────────────
  const { data: etatsNominatifs } = useQuery({
    queryKey: ["etats-nominatifs", "dashboard", poste?.id_poste, today.getFullYear()],
    queryFn: () => getEtatsNominatifs({
      date_debut: periodeAnnee.date_debut,
      date_fin: periodeAnnee.date_fin,
    }),
    
    enabled: !!poste,
  });
  console.log('etatsNominatifs:', etatsNominatifs)

  // Séparer RAR et AMENDE
  const etatsRAR  = (etatsNominatifs || []).filter((e: any) => e.type === 'RAR');
  const etatsAMENDE = (etatsNominatifs || []).filter((e: any) => e.type === 'AMENDE');

  const totalBalanceRAR: number = etatsRAR.reduce(
    (sum: number, e: any) => sum + (e.total_balance || 0), 0
  );
  const totalBalanceAMENDE: number = etatsAMENDE.reduce(
    (sum: number, e: any) => sum + (e.total_balance || 0), 0
  );
  const totalPhysique: number = (etatsNominatifs || []).reduce(
    (sum: number, etat: any) => sum + (etat.total_physique || 0), 0
  );

  const nbEtats: number = (etatsNominatifs || []).length;

  const dernierMoisEtat: number | null = (() => {
    if (!etatsNominatifs?.length) return null;
    const mois = etatsNominatifs.map((e: any) => new Date(e.date_etat).getMonth());
    return Math.max(...mois);
  })();

  const labelEtat = dernierMoisEtat !== null
    ? `Dernier : ${MOIS_NOMS[dernierMoisEtat]} ${today.getFullYear()}`
    : 'Aucun enregistrement';

  // ── Rapprochements ────────────────────────────────────────────────────────
  const { data: rapprochements } = useQuery({
    queryKey: ["rapprochements", "dashboard", poste?.id_poste],
    queryFn: () => getRapprochements(),
    enabled: !!poste,
  });

  const rapprochementsAnnee = (rapprochements || []).filter((r: any) => {
    const d = new Date(r.date_rapprochement);
    return d.getFullYear() === today.getFullYear();
  });

  const dernierMoisRap: number | null = (() => {
    if (!rapprochementsAnnee.length) return null;
    const mois = rapprochementsAnnee.map((r: any) => new Date(r.date_rapprochement).getMonth());
    return Math.max(...mois);
  })();

  const nbRapprochements: number = rapprochementsAnnee.length;
  const totalSoldeBalance: number = rapprochementsAnnee.reduce(
    (s: number, r: any) => s + (r.solde_theorique || 0), 0
  );
  const totalEcart: number = rapprochementsAnnee.reduce(
    (s: number, r: any) => s + Math.abs(r.ecart || 0), 0
  );

  const labelRap = dernierMoisRap !== null
    ? `Dernier : ${MOIS_NOMS[dernierMoisRap]} ${today.getFullYear()}`
    : 'Aucun enregistrement';

  // ── Rapports PROTOCOLE / CAC ──────────────────────────────────────────────
  const { data: rapportProtocole } = useQuery<RapportUnite[]>({
    queryKey: ["rapport", "PROTOCOLE", today.getFullYear(), poste?.id_poste],
    queryFn: () => getRapportTableau({
      type_rapport: "PROTOCOLE",
      date_debut: periodeAnnee.date_debut,
      date_fin: periodeAnnee.date_fin,
      ...(!isAdmin && poste ? { id_poste: poste.id_poste } : {}),
    }),
    enabled: !!poste,
  });

  const { data: rapportCAC } = useQuery<RapportUnite[]>({
    queryKey: ["rapport", "CAC", today.getFullYear(), poste?.id_poste],
    queryFn: () => getRapportTableau({
      type_rapport: "CAC",
      date_debut: periodeAnnee.date_debut,
      date_fin: periodeAnnee.date_fin,
      ...(!isAdmin && poste ? { id_poste: poste.id_poste } : {}),
    }),
    enabled: !!poste,
  });

  const monthlyProtocole = aggregateMonthlyTotals(rapportProtocole);
  const monthlyCAC = aggregateMonthlyTotals(rapportCAC);
  const totalProtocole = computeGrandTotal(rapportProtocole);
  const totalCAC = computeGrandTotal(rapportCAC);

  // Dernier mois PROTOCOLE/CAC
  const dernierMoisProtocole: number | null = (() => {
    const idx = [...monthlyProtocole].reverse().findIndex(v => v > 0);
    return idx === -1 ? null : 11 - idx;
  })();

  const labelPeriode = dernierMoisProtocole !== null
    ? `janvier – ${MOIS_NOMS[dernierMoisProtocole]} ${today.getFullYear()}`
    : `${today.getFullYear()}`;

  // ── Options graphiques ────────────────────────────────────────────────────
  const donutOptions = (color: string, value: number, max: number): ApexOptions => ({
    chart: { type: "radialBar", sparkline: { enabled: true } },
    plotOptions: {
      radialBar: {
        hollow: { size: "60%" },
        dataLabels: { show: false },
        track: { background: "#f0f0f0" },
      },
    },
    colors: [color],
    series: [max > 0 ? Math.min((value / max) * 100, 100) : 0],
  });

  const chartOptions: ApexOptions = {
    chart: { type: "area", height: 350, toolbar: { show: false }, zoom: { enabled: false } },
    dataLabels: { enabled: false },
    stroke: { curve: "smooth", width: 3 },
    colors: ["#4361ee", "#2ec4b6"],
    xaxis: { categories: MOIS_LABELS, axisBorder: { show: false }, axisTicks: { show: false } },
    yaxis: { labels: { formatter: (val: number) => formatMontantCourt(val) } },
    tooltip: { y: { formatter: (val: number) => formatMontant(val) } },
    grid: { borderColor: "#f0f0f0" },
    legend: { position: "top" },
  };

  const repartitionOptions: ApexOptions = {
    chart: { type: "donut" },
    labels: ["PROTOCOLE", "CAC", "États RAR", "États AMENDE", "Rapprochements"],
    colors: ["#4361ee", "#2ec4b6", "#4361ee99", "#ff9f1c", "#7934f3"],
    legend: { position: "bottom" },
    dataLabels: { enabled: false },
    plotOptions: { pie: { donut: { size: "65%" } } },
    tooltip: { y: { formatter: (val: number) => formatMontant(val) } },
  };
  const repartitionSeries = [totalProtocole, totalCAC, totalBalanceRAR, totalBalanceAMENDE, totalSoldeBalance];

  if (!poste) {
    return (
      <div className="pd-20 text-center">
        <Spinner />
        <p>Chargement du poste...</p>
      </div>
    );
  }

  return (
    <div>
      {/* ── Bannière ── */}
      <div className="card-box pd-20 height-70-p mb-30">
        <div className="row align-items-center">
          <div className="col-md-4">
            <img src="./vendors/images/banner-img.png" alt="" />
          </div>
          <div className="col-md-5">
            <h4 className="font-20 weight-500 mb-10 text-capitalize">
              Bienvenue{" "}
              <div className="weight-600 font-30 text-blue">
                {user?.prenom} {user?.nom}
              </div>
            </h4>
            <p className="font-18 max-width-600">
              Vous êtes au poste de <strong>{poste?.nom_poste}</strong>
            </p>
            <p style={{ fontSize: 12, color: '#888', margin: 0 }}>
              Données affichées jusqu'au dernier enregistrement disponible
            </p>
          </div>
          <div className="col-md-3 text-center">
            <AnalogClock />
          </div>
        </div>
      </div>

      {/* ── 4 KPI Cards ── */}
      <div className="row">

        {/* 1. États nominatifs — RAR + AMENDE côte à côte */}
        <div className="col-xl-3 mb-30">
          <div className="card-box height-100-p" style={{ padding: '16px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
              États nominatifs
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'stretch' }}>
              {/* RAR */}
              <div style={{
                flex: 1, background: '#eff6ff', borderRadius: 8,
                padding: '10px 8px', textAlign: 'center',
                borderTop: '3px solid #4361ee',
              }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#4361ee' }}>
                  {formatMontantCourt(totalBalanceRAR)}
                </div>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#555', marginTop: 3 }}>RAR</div>
                <div style={{ fontSize: 10, color: '#aaa', marginTop: 2 }}>
                  {etatsRAR.length} état{etatsRAR.length > 1 ? 's' : ''}
                </div>
              </div>
              {/* AMENDE */}
              <div style={{
                flex: 1, background: '#fff7ed', borderRadius: 8,
                padding: '10px 8px', textAlign: 'center',
                borderTop: '3px solid #ff9f1c',
              }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#ff9f1c' }}>
                  {formatMontantCourt(totalBalanceAMENDE)}
                </div>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#555', marginTop: 3 }}>AMENDE</div>
                <div style={{ fontSize: 10, color: '#aaa', marginTop: 2 }}>
                  {etatsAMENDE.length} état{etatsAMENDE.length > 1 ? 's' : ''}
                </div>
              </div>
            </div>
            <div style={{ fontSize: 10, color: '#aaa', marginTop: 8, textAlign: 'center' }}>
              {labelEtat}
            </div>
          </div>
        </div>

        {/* 2. PROTOCOLE */}
        <div className="col-xl-3 mb-30">
          <div className="card-box height-100-p widget-style1">
            <div className="d-flex flex-wrap align-items-center">
              <div className="progress-data">
                <ReactApexChart
                  options={donutOptions("#2ec4b6", totalProtocole, totalProtocole + totalCAC || 1)}
                  series={donutOptions("#2ec4b6", totalProtocole, totalProtocole + totalCAC || 1).series as number[]}
                  type="radialBar" height={80} width={80}
                />
              </div>
              <div className="widget-data">
                <div className="h4 mb-0">{formatMontantCourt(totalProtocole)}</div>
                <div className="weight-600 font-14">PROTOCOLE</div>
                <div style={{ fontSize: 10, color: '#aaa', marginTop: 2 }}>{labelPeriode}</div>
              </div>
            </div>
          </div>
        </div>

        {/* 3. CAC */}
        <div className="col-xl-3 mb-30">
          <div className="card-box height-100-p widget-style1">
            <div className="d-flex flex-wrap align-items-center">
              <div className="progress-data">
                <ReactApexChart
                  options={donutOptions("#ff9f1c", totalCAC, totalProtocole + totalCAC || 1)}
                  series={donutOptions("#ff9f1c", totalCAC, totalProtocole + totalCAC || 1).series as number[]}
                  type="radialBar" height={80} width={80}
                />
              </div>
              <div className="widget-data">
                <div className="h4 mb-0">{formatMontantCourt(totalCAC)}</div>
                <div className="weight-600 font-14">CAC</div>
                <div style={{ fontSize: 10, color: '#aaa', marginTop: 2 }}>{labelPeriode}</div>
              </div>
            </div>
          </div>
        </div>

        {/* 4. Rapprochements */}
        <div className="col-xl-3 mb-30">
          <div className="card-box height-100-p widget-style1">
            <div className="d-flex flex-wrap align-items-center">
              <div className="progress-data">
                <ReactApexChart
                  options={donutOptions("#7934f3", nbRapprochements, 12)}
                  series={donutOptions("#7934f3", nbRapprochements, 12).series as number[]}
                  type="radialBar" height={80} width={80}
                />
              </div>
              <div className="widget-data">
                <div className="h4 mb-0">{nbRapprochements}</div>
                <div className="weight-600 font-14">Rapprochements</div>
                <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>
                  Solde : {formatMontantCourt(totalSoldeBalance)}
                </div>
                <div style={{ fontSize: 10, color: totalEcart > 0 ? '#e53e3e' : '#aaa', marginTop: 1 }}>
                  {totalEcart > 0 ? `Écart : ${formatMontantCourt(totalEcart)}` : 'Aucun écart'} · {labelRap}
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* ── Graphiques ── */}
      <div className="row">
        <div className="col-xl-8 mb-30">
          <div className="card-box height-100-p pd-20">
            <div className="d-flex justify-content-between align-items-center mb-20">
              <h2 className="h4 mb-0">Évolution des recettes</h2>
              <span style={{ fontSize: 12, color: '#888' }}>{labelPeriode}</span>
            </div>
            <ReactApexChart
              options={chartOptions}
              series={[
                { name: "PROTOCOLE", data: monthlyProtocole },
                { name: "CAC", data: monthlyCAC },
              ]}
              type="area" height={320}
            />
          </div>
        </div>

        <div className="col-xl-4 mb-30">
          <div className="card-box height-100-p pd-20">
            <h2 className="h4 mb-20">Répartition annuelle</h2>
            <ReactApexChart
              options={repartitionOptions}
              series={repartitionSeries}
              type="donut" height={320}
            />
          </div>
        </div>
      </div>
    </div>
  );
}