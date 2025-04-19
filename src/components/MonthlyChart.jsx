import React, { useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

function MonthlyChart({ users }) {
  const chartData = useMemo(() => {
    const monthlyStats = {}; // 예: { '2025-04': { requested: 5, approved: 3, rejected: 1 }, ... }

    users.forEach(user => {
      try {
        // 요청 날짜 기준 월별 집계
        if (user.request_timestamp) {
          const month = user.request_timestamp.substring(0, 7); // 'YYYY-MM' 형식
          if (!monthlyStats[month]) {
            monthlyStats[month] = { requested: 0, approved: 0, rejected: 0 };
          }
          monthlyStats[month].requested += 1;

          // 승인/거절 날짜 기준 월별 집계
          if (user.approval_timestamp) {
             const approvalMonth = user.approval_timestamp.substring(0, 7);
             // 요청 월과 승인/거절 월이 다를 수 있으므로 해당 월에도 카운트
             if (!monthlyStats[approvalMonth]) {
                 monthlyStats[approvalMonth] = { requested: 0, approved: 0, rejected: 0 };
             }
             if (user.status === 'Approved') {
               monthlyStats[approvalMonth].approved += 1;
             } else if (user.status === 'Rejected') {
               monthlyStats[approvalMonth].rejected += 1;
             }
          }
        }
      } catch (e) {
        console.error("월별 데이터 집계 오류:", user, e);
      }
    });

    // Chart.js 데이터 형식으로 변환
    const labels = Object.keys(monthlyStats).sort(); // 월별 정렬
    const requestedData = labels.map(month => monthlyStats[month].requested);
    const approvedData = labels.map(month => monthlyStats[month].approved);
    const rejectedData = labels.map(month => monthlyStats[month].rejected);

    return {
      labels,
      datasets: [
        {
          label: '요청',
          data: requestedData,
          backgroundColor: 'rgba(54, 162, 235, 0.6)', // 파란색
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1,
        },
        {
          label: '승인',
          data: approvedData,
          backgroundColor: 'rgba(75, 192, 192, 0.6)', // 녹색
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1,
        },
        {
          label: '거절',
          data: rejectedData,
          backgroundColor: 'rgba(255, 99, 132, 0.6)', // 빨간색
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 1,
        },
      ],
    };
  }, [users]);

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: '월별 라이선스 처리 현황',
      },
    },
    scales: {
        y: {
            beginAtZero: true,
            ticks: {
                stepSize: 1 // 정수 단위로 표시
            }
        }
    }
  };

  return (
    <div className="mb-8 p-4 bg-white rounded-lg shadow-md">
      <Bar options={options} data={chartData} />
    </div>
  );
}

export default MonthlyChart;
