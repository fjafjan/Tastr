import axios from 'axios';
import { ChartData, ChartOptions } from 'chart.js';
import 'chart.js/auto';
import React, { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import { StyleSheet } from 'react-native';
import { SafeAreaView, Text, View } from 'react-native-web';
import { useParams } from 'react-router-dom';
import { SERVER_URL } from '../constants/Constants';

// Props type
interface ResultsPageProps {
  id: string;
}

const ResultsPage: React.FC<ResultsPageProps> = ({ id }) => {
  const { categoryId } = useParams<{ categoryId: string }>(); // Extract category ID from URL
  const [chartData, setChartData] = useState<ChartData<'bar'>>({
    labels: [],
    datasets: [
      {
        label: 'MMR (Tasty?!)',
        data: [],
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
    ],
  });

  const fetchVotes = async (): Promise<void> => {
    try {
      const response = await axios.get<{ [key: string]: number }>(
        `${SERVER_URL}/${categoryId}/mmr`,
      );
      const data = response.data;

      const names = Object.keys(data);
      const values = Object.values(data);

      setChartData({
        labels: names,
        datasets: [
          {
            label: 'MMR (Tasty?)',
            data: values,
            backgroundColor: 'rgba(75, 192, 192, 0.6)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1,
          },
        ],
      });
    } catch (error) {
      console.error('Error fetching votes', error);
    }
  };

  // Chart options with typed configuration
  const chartOptions: ChartOptions<'bar'> = {
    maintainAspectRatio: false,
    scales: {
      y: {
        min: 500, // Minimum value for the y-axis
        max: 1500, // Maximum value for the y-axis (adjust as needed)
      },
    },
  };

  useEffect(() => {
    fetchVotes();
  }, [categoryId]);

  return (
    <SafeAreaView id={id} style={styles.container}>
      <Text style={styles.title}>And the Oracles have spoken</Text>
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>MMR per {categoryId}</Text>
        <Bar data={chartData} options={chartOptions} />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  chartContainer: {
    width: '80%',
    height: 300,
    padding: 20,
  },
  chartTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
});

export default ResultsPage;
