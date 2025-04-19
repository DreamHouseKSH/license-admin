import React, { useState, useMemo, useEffect } from 'react';
import { Line, Bar, Scatter } from 'react-chartjs-2'; // Scatter 추가
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  // Scatter 차트에는 특별히 추가 등록이 필요 없을 수 있음 (v3+)
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const MONTH_LABELS = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];

// 데이터셋 기본 정보
const DATASET_CONFIG = {
  requested: {
    label: '요청',
    borderColor: 'rgb(54, 162, 235)',
    backgroundColor: 'rgba(54, 162, 235, 0.5)',
  },
  approved: {
    label: '승인',
    borderColor: 'rgb(75, 192, 192)',
    backgroundColor: 'rgba(75, 192, 192, 0.5)',
  },
  rejected: {
    label: '거절',
    borderColor: 'rgb(255, 99, 132)',
    backgroundColor: 'rgba(255, 99, 132, 0.5)',
  },
};

function MonthlyChart({ users }) {
  const [availableYears, setAvailableYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [chartType, setChartType] = useState('line');
  const [visibleDatasets, setVisibleDatasets] = useState({
    requested: true,
    approved: true,
    rejected: true,
  });

  // 연도 목록 추출
  useEffect(() => {
    const years = new Set();
    users.forEach(user => {
      if (user.request_timestamp) try { years.add(new Date(user.request_timestamp).getFullYear()); } catch (e) {}
      if (user.approval_timestamp) try { years.add(new Date(user.approval_timestamp).getFullYear()); } catch (e) {}
    });
    const sortedYears = Array.from(years).sort((a, b) => b - a);
    setAvailableYears(sortedYears);
    if (sortedYears.length > 0 && !sortedYears.includes(selectedYear)) {
      setSelectedYear(sortedYears[0]);
    } else if (sortedYears.length === 0) {
      setSelectedYear(new Date().getFullYear());
    }
  }, [users]);

  // 데이터 및 옵션 계산
  const { chartData, options } = useMemo(() => {
    // 월별 데이터 집계
    const monthlyData = {};
    MONTH_LABELS.forEach((_, index) => {
      const monthKey = String(index + 1).padStart(2, '0');
      monthlyData[monthKey] = { requested: 0, approved: 0, rejected: 0 };
    });
    users.forEach(user => {
       try {
         if (user.request_timestamp) {
           const requestDate = new Date(user.request_timestamp);
           if (requestDate.getFullYear() === selectedYear) {
             const monthKey = String(requestDate.getMonth() + 1).padStart(2, '0');
             if (monthlyData[monthKey]) monthlyData[monthKey].requested += 1;
           }
         }
         if (user.approval_timestamp) {
           const approvalDate = new Date(user.approval_timestamp);
           if (approvalDate.getFullYear() === selectedYear) {
             const monthKey = String(approvalDate.getMonth() + 1).padStart(2, '0');
             if (monthlyData[monthKey]) {
               if (user.status === 'Approved') monthlyData[monthKey].approved += 1;
               else if (user.status === 'Rejected') monthlyData[monthKey].rejected += 1;
             }
           }
         }
       } catch (e) { console.error("월별 데이터 집계 오류:", user, e); }
    });

    // 데이터 배열 생성 및 Scatter용 데이터 생성 (0 처리 방식 변경)
    const processData = (type) => MONTH_LABELS.map((label, index) => {
        const count = monthlyData[String(index + 1).padStart(2, '0')][type];
        const lineBarValue = count === 0 ? null : count; // Line/Bar: 0이면 null
        // Scatter: 0이면 null 반환
        const scatterValue = count === 0 ? null : { x: label, y: count };
        return { lineBarValue: lineBarValue, scatterValue: scatterValue };
    });

    const processed = {
        requested: processData('requested'),
        approved: processData('approved'),
        rejected: processData('rejected'),
    };

    const datasets = [];
    // visibleDatasets 상태에 따라 데이터셋 추가 (조건 수정: 항상 추가)
    Object.keys(visibleDatasets).forEach(key => {
        if (visibleDatasets[key]) {
            const isScatter = chartType === 'scatter';
            // Scatter는 null 값을 필터링, Line/Bar는 null 유지
            const data = isScatter
                ? processed[key].map(d => d.scatterValue).filter(val => val !== null)
                : processed[key].map(d => d.lineBarValue);

            // 데이터가 없는 경우(특히 Scatter에서 모든 값이 0일 때) 빈 데이터셋 추가 방지?
            // -> 아니면 빈 데이터셋이라도 추가해야 범례에 표시됨. data가 비어있으면 차트는 안 그려짐.
            // if (data.length === 0 && isScatter) continue; // 데이터 없으면 건너뛰기 (범례에서도 사라짐) - 주석 처리

            datasets.push({
                ...DATASET_CONFIG[key],
                data: data,
                tension: chartType === 'line' ? 0.1 : undefined,
                // Scatter 옵션 추가: 점만 표시되도록 line 숨김
                showLine: !isScatter,
                // Scatter 옵션 추가: 점 크기 등 설정 가능
                pointRadius: isScatter ? 5 : undefined,
                pointHoverRadius: isScatter ? 7 : undefined,
            });
        }
    });


    const finalChartData = {
        // Scatter는 labels 대신 datasets의 x,y로 축을 그림
        labels: chartType !== 'scatter' ? MONTH_LABELS : undefined,
        datasets
    };

    // Y축 최대값 계산
    let maxVal = 0;
    finalChartData.datasets.forEach(dataset => {
        const dataToConsider = chartType === 'scatter'
            ? dataset.data.map(p => p.y) // Scatter 데이터에서 y값 추출
            : dataset.data.filter(val => val !== null); // Line/Bar 데이터에서 null 제외
        const currentMax = Math.max(...dataToConsider, 0);
        if (currentMax > maxVal) maxVal = currentMax;
    });
    const suggestedMax = Math.max(10, Math.ceil(maxVal) + 2);

    const finalOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top' },
        title: {
          display: false, // 차트 라이브러리 타이틀 숨김
          text: `${selectedYear}년 월별 라이선스 처리 현황 (${chartType})`,
          font: {
            size: 24, // text-2xl에 해당하는 크기 (px)
            weight: 'bold', // font-bold
          }
        },
      },
      layout: { padding: 0 },
      scales: {
        // Scatter는 x축이 Category가 아닐 수 있으므로 타입 명시 필요할 수 있음
        x: chartType === 'scatter' ? { type: 'category', labels: MONTH_LABELS } : { type: 'category' }, // Scatter일 때 labels 명시
        y: {
          beginAtZero: true,
          max: suggestedMax,
          ticks: { callback: function(value) { if (Number.isInteger(value)) { return value; } } },
        }
      },
      spanGaps: chartType === 'line' ? true : undefined,
    };

    return { chartData: finalChartData, options: finalOptions };

  }, [users, selectedYear, chartType, visibleDatasets]);

  // 체크박스 변경 핸들러
  const handleCheckboxChange = (event) => {
    const { name, checked } = event.target;
    setVisibleDatasets(prev => ({ ...prev, [name]: checked }));
  };

  // 차트 컴포넌트 선택
  let ChartComponent;
  if (chartType === 'line') ChartComponent = Line;
  else if (chartType === 'bar') ChartComponent = Bar;
  else if (chartType === 'scatter') ChartComponent = Scatter;
  else ChartComponent = Line; // 기본값

  return (
    <div className="h-full flex flex-col p-4">
       {/* JSX로 타이틀 추가 */}
       <h2 className="text-2xl font-bold text-center mb-4 text-gray-700">
         {`${selectedYear}년 월별 라이선스 처리 현황 (${chartType})`}
       </h2>
       {/* 컨트롤 영역 */}
       <div className="mb-4 flex flex-wrap justify-between items-center gap-4">
         {/* 연도 및 차트 종류 선택 그룹 */}
         <div className="flex items-center gap-4">
           {/* 연도 선택 */}
           <div>
             <label htmlFor="year-select" className="mr-2 text-sm font-medium text-gray-700">연도:</label>
             <select id="year-select" value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))} className="p-1 border border-gray-300 rounded-md text-sm">
               {availableYears.length > 0 ? availableYears.map(year => <option key={year} value={year}>{year}년</option>) : <option value={selectedYear}>{selectedYear}년</option>}
             </select>
           </div>
           {/* 차트 종류 선택 */}
           <div>
              <label htmlFor="chart-type-select" className="mr-2 text-sm font-medium text-gray-700">종류:</label>
              <select id="chart-type-select" value={chartType} onChange={(e) => setChartType(e.target.value)} className="p-1 border border-gray-300 rounded-md text-sm">
                <option value="line">선</option>
                <option value="bar">막대</option>
                <option value="scatter">점</option> {/* 점(Scatter) 옵션 추가 */}
              </select>
           </div>
         </div>

         {/* 데이터셋 선택 체크박스 */}
         <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-700">표시:</span>
            {Object.keys(DATASET_CONFIG).map((key) => (
              <div key={key} className="flex items-center">
                <input
                  type="checkbox"
                  id={`checkbox-${key}`}
                  name={key}
                  checked={visibleDatasets[key]}
                  onChange={handleCheckboxChange}
                  className={`h-4 w-4 border-gray-300 rounded focus:ring-blue-500 ${
                    key === 'requested' ? 'text-blue-600' : key === 'approved' ? 'text-green-600' : 'text-red-600'
                  }`}
                />
                <label
                  htmlFor={`checkbox-${key}`}
                  className={`ml-2 text-sm font-medium ${
                    key === 'requested' ? 'text-blue-700' : key === 'approved' ? 'text-green-700' : 'text-red-700'
                  }`}
                >
                  {DATASET_CONFIG[key].label}
                </label>
              </div>
            ))}
         </div>
       </div>

       {/* 차트 영역 */}
       <div className="flex-grow relative">
         {ChartComponent && <ChartComponent options={options} data={chartData} />} {/* 조건부 렌더링 */}
       </div>
    </div>
  );
}

export default MonthlyChart;
