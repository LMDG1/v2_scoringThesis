
interface AnalyticsEvent {
    timestamp: string;
    studentId: number;
    eventType: 'why_click' | 'score_change';
    details: string;
  }
  
  class AnalyticsStore {
    private events: AnalyticsEvent[] = [];
  
    addEvent(studentId: number, eventType: 'why_click' | 'score_change', details: string) {
      this.events.push({
        timestamp: new Date().toISOString(),
        studentId,
        eventType,
        details
      });
    }
  
    downloadCSV() {
      const headers = ['Timestamp', 'Student ID', 'Event Type', 'Details'];
      const rows = this.events.map(event => [
        event.timestamp,
        event.studentId.toString(),
        event.eventType,
        event.details
      ]);
      
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');
  
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `scoring-analytics-${new Date().toISOString()}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }
  }
  
  export const analyticsStore = new AnalyticsStore();
  