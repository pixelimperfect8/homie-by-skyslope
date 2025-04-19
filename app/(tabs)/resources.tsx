import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, TextInput, Dimensions, Modal } from 'react-native';
import { useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from '@/constants/Colors';
import Button from '@/components/Button';
import { useAuth } from '@/context/AuthContext';
import { agents } from '@/assets/agent-images';
import { Phone, Mail, Star, Calculator, Users, Clock, ChevronRight, ChevronDown, X } from 'lucide-react-native';
import { LineChart } from 'react-native-chart-kit';

const { width } = Dimensions.get('window');

export default function ResourcesScreen() {
  const { user } = useAuth();
  const colorScheme = useColorScheme() || 'light';
  const colors = Colors[colorScheme];
  
  const [activeTab, setActiveTab] = useState<'calculator' | 'agents' | 'timeline' | 'overview'>('overview');
  const [timelineModalVisible, setTimelineModalVisible] = useState(false);
  const [selectedTimeline, setSelectedTimeline] = useState('buying');
  
  // Calculator state
  const [income, setIncome] = useState('5000');
  const [downPayment, setDownPayment] = useState('50000');
  const [interestRate, setInterestRate] = useState('4.5');
  const [term, setTerm] = useState('30');
  
  const renderCalculator = () => {
    const monthlyIncome = parseFloat(income) || 0;
    const totalDownPayment = parseFloat(downPayment) || 0;
    const rate = parseFloat(interestRate) || 0;
    const loanTerm = parseFloat(term) || 30;
    
    // Simple affordability calculation (very simplified)
    const maxMonthlyPayment = monthlyIncome * 0.28; // 28% rule of thumb
    const monthlyRate = rate / 100 / 12;
    const numberOfPayments = loanTerm * 12;
    
    // Calculate loan amount using the mortgage formula
    let loanAmount = 0;
    if (monthlyRate > 0) {
      loanAmount = maxMonthlyPayment * ((1 - Math.pow(1 + monthlyRate, -numberOfPayments)) / monthlyRate);
    }
    
    const homePrice = loanAmount + totalDownPayment;
    
    // Calculate monthly breakdown
    const principal = loanAmount / numberOfPayments;
    const interest = loanAmount * monthlyRate;
    const taxes = homePrice * 0.012 / 12; // Estimated annual property tax of 1.2%
    const insurance = homePrice * 0.005 / 12; // Estimated annual insurance of 0.5%
    
    const chartData = {
      labels: ['Principal', 'Interest', 'Taxes', 'Insurance'],
      datasets: [
        {
          data: [principal, interest, taxes, insurance],
          color: (opacity = 1) => `rgba(0, 102, 255, ${opacity})`,
        },
      ],
    };
    
    return (
      <View style={styles.calculatorContainer}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Home Affordability Calculator
        </Text>
        
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Monthly Income ($)</Text>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }
            ]}
            value={income}
            onChangeText={setIncome}
            keyboardType="numeric"
            placeholder="5000"
            placeholderTextColor={colors.muted}
          />
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Down Payment ($)</Text>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }
            ]}
            value={downPayment}
            onChangeText={setDownPayment}
            keyboardType="numeric"
            placeholder="50000"
            placeholderTextColor={colors.muted}
          />
        </View>
        
        <View style={styles.row}>
          <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
            <Text style={[styles.label, { color: colors.text }]}>Interest Rate (%)</Text>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }
              ]}
              value={interestRate}
              onChangeText={setInterestRate}
              keyboardType="numeric"
              placeholder="4.5"
              placeholderTextColor={colors.muted}
            />
          </View>
          
          <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
            <Text style={[styles.label, { color: colors.text }]}>Loan Term (years)</Text>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }
              ]}
              value={term}
              onChangeText={setTerm}
              keyboardType="numeric"
              placeholder="30"
              placeholderTextColor={colors.muted}
            />
          </View>
        </View>
        
        <View style={[styles.resultContainer, { backgroundColor: colors.card }]}>
          <View style={styles.resultHeader}>
            <Text style={[styles.resultTitle, { color: colors.text }]}>
              Estimated Home Price
            </Text>
            <Text style={[styles.resultPrice, { color: colors.primary }]}>
              ${homePrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </Text>
          </View>
          
          <Text style={[styles.resultSubtitle, { color: colors.secondary }]}>
            Monthly Payment Breakdown
          </Text>
          
          <LineChart
            data={chartData}
            width={width - 64}
            height={220}
            chartConfig={{
              backgroundColor: colors.card,
              backgroundGradientFrom: colors.card,
              backgroundGradientTo: colors.card,
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(0, 102, 255, ${opacity})`,
              labelColor: (opacity = 1) => colors.text,
              style: {
                borderRadius: 16,
              },
            }}
            bezier
            style={styles.chart}
          />
          
          <View style={styles.breakdown}>
            <View style={styles.breakdownItem}>
              <Text style={[styles.breakdownLabel, { color: colors.text }]}>Principal</Text>
              <Text style={[styles.breakdownValue, { color: colors.text }]}>
                ${principal.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </Text>
            </View>
            
            <View style={styles.breakdownItem}>
              <Text style={[styles.breakdownLabel, { color: colors.text }]}>Interest</Text>
              <Text style={[styles.breakdownValue, { color: colors.text }]}>
                ${interest.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </Text>
            </View>
            
            <View style={styles.breakdownItem}>
              <Text style={[styles.breakdownLabel, { color: colors.text }]}>Taxes</Text>
              <Text style={[styles.breakdownValue, { color: colors.text }]}>
                ${taxes.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </Text>
            </View>
            
            <View style={styles.breakdownItem}>
              <Text style={[styles.breakdownLabel, { color: colors.text }]}>Insurance</Text>
              <Text style={[styles.breakdownValue, { color: colors.text }]}>
                ${insurance.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </Text>
            </View>
            
            <View style={[styles.breakdownItem, styles.totalItem, { borderTopColor: colors.border }]}>
              <Text style={[styles.breakdownLabel, { color: colors.text, fontWeight: '600' }]}>
                Total Monthly
              </Text>
              <Text style={[styles.breakdownValue, { color: colors.primary, fontWeight: '600' }]}>
                ${(principal + interest + taxes + insurance).toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  };
  
  const renderAgents = () => {
    return (
      <View style={styles.agentsContainer}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Find a Real Estate Agent
        </Text>
        
        {agents.map((agent) => (
          <View 
            key={agent.id} 
            style={[
              styles.agentCard, 
              { backgroundColor: colors.card, borderColor: colors.border }
            ]}
          >
            <Image source={{ uri: agent.photo }} style={styles.agentPhoto} />
            
            <View style={styles.agentInfo}>
              <Text style={[styles.agentName, { color: colors.text }]}>{agent.name}</Text>
              <Text style={[styles.agentCompany, { color: colors.secondary }]}>{agent.company}</Text>
              
              <View style={styles.ratingContainer}>
                <Star size={16} color="#FFD700" fill="#FFD700" />
                <Text style={[styles.rating, { color: colors.text }]}>{agent.rating}</Text>
              </View>
              
              <View style={styles.agentActions}>
                <TouchableOpacity 
                  style={[
                    styles.agentButton, 
                    { backgroundColor: colors.primary }
                  ]}
                >
                  <Phone size={16} color="white" />
                  <Text style={styles.agentButtonText}>Call</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[
                    styles.agentButton, 
                    { backgroundColor: colors.card, borderColor: colors.primary, borderWidth: 1 }
                  ]}
                >
                  <Mail size={16} color={colors.primary} />
                  <Text style={[styles.agentButtonText, { color: colors.primary }]}>Email</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}
      </View>
    );
  };
  
  const getTimelineItems = () => {
    switch (selectedTimeline) {
      case 'selling':
        return [
          {
            id: '1',
            title: 'Prepare Your Home',
            description: 'Clean, declutter, and make necessary repairs to get your home market-ready.',
            days: 'Weeks 1-4',
          },
          {
            id: '2',
            title: 'Find a Listing Agent',
            description: 'Interview and select an experienced real estate agent to represent you.',
            days: 'Weeks 4-5',
          },
          {
            id: '3',
            title: 'Price and List',
            description: 'Determine the right listing price and make your home available on the market.',
            days: 'Weeks 5-6',
          },
          {
            id: '4',
            title: 'Showings and Open Houses',
            description: 'Allow potential buyers to tour your home and host open houses.',
            days: 'Weeks 6-10',
          },
          {
            id: '5',
            title: 'Review Offers',
            description: 'Evaluate offers, negotiate terms, and accept the best offer.',
            days: 'Weeks 10-12',
          },
          {
            id: '6',
            title: 'Closing',
            description: 'Complete paperwork, resolve contingencies, and finalize the sale.',
            days: 'Weeks 12-16',
          },
        ];
      case 'mortgage':
        return [
          {
            id: '1',
            title: 'Pre-Qualification',
            description: 'Get an estimate of how much you might be able to borrow based on your finances.',
            days: 'Days 1-2',
          },
          {
            id: '2',
            title: 'Pre-Approval',
            description: 'Complete a formal application and get a conditional commitment for a specific loan amount.',
            days: 'Days 3-7',
          },
          {
            id: '3',
            title: 'Home Selection & Offer',
            description: 'Find your home and make an offer that includes your financing terms.',
            days: 'Days 7-30',
          },
          {
            id: '4',
            title: 'Loan Processing',
            description: 'Submit documentation and your lender begins verifying your information.',
            days: 'Days 30-40',
          },
          {
            id: '5',
            title: 'Underwriting',
            description: 'Lender reviews your application and supporting documents to make final approval decision.',
            days: 'Days 40-45',
          },
          {
            id: '6',
            title: 'Closing',
            description: 'Sign final paperwork, pay closing costs, and officially secure your mortgage.',
            days: 'Days 45-60',
          },
        ];
      case 'renovation':
        return [
          {
            id: '1',
            title: 'Planning & Design',
            description: 'Determine your goals, budget, and create detailed plans for your renovation.',
            days: 'Weeks 1-4',
          },
          {
            id: '2',
            title: 'Permits & Approvals',
            description: 'Obtain necessary building permits and homeowner association approvals if needed.',
            days: 'Weeks 4-8',
          },
          {
            id: '3',
            title: 'Contractor Selection',
            description: 'Interview contractors, get multiple bids, and select your renovation team.',
            days: 'Weeks 8-10',
          },
          {
            id: '4',
            title: 'Demolition & Construction',
            description: 'Remove existing structures and begin building according to your plans.',
            days: 'Weeks 10-18',
          },
          {
            id: '5',
            title: 'Finishing Work',
            description: 'Complete painting, fixtures, flooring, and other finishing details.',
            days: 'Weeks 18-22',
          },
          {
            id: '6',
            title: 'Final Inspection',
            description: 'Ensure all work passes inspection and make any necessary adjustments.',
            days: 'Weeks 22-24',
          },
        ];
      case 'buying':
      default:
        return [
          {
            id: '1',
            title: 'Pre-Approval',
            description: 'Get pre-approved for a mortgage to understand your budget.',
            days: 'Days 1-7',
          },
          {
            id: '2',
            title: 'House Hunting',
            description: 'Work with a realtor to find homes that match your criteria.',
            days: 'Days 7-30',
          },
          {
            id: '3',
            title: 'Make an Offer',
            description: 'When you find the right home, make an offer and negotiate terms.',
            days: 'Days 30-37',
          },
          {
            id: '4',
            title: 'Home Inspection',
            description: 'Get the home inspected to identify any issues.',
            days: 'Days 37-44',
          },
          {
            id: '5',
            title: 'Secure Financing',
            description: 'Finalize your mortgage application and loan terms.',
            days: 'Days 44-51',
          },
          {
            id: '6',
            title: 'Closing',
            description: 'Sign the final paperwork and get the keys to your new home!',
            days: 'Days 51-60',
          },
        ];
    }
  };

  const timelineOptions = [
    { id: 'buying', label: 'Home Buying Timeline' },
    { id: 'selling', label: 'Home Selling Timeline' },
    { id: 'mortgage', label: 'Mortgage Application Timeline' },
    { id: 'renovation', label: 'Home Renovation Timeline' },
  ];
  
  const getTimelineTitle = () => {
    const option = timelineOptions.find(o => o.id === selectedTimeline);
    return option ? option.label : 'Home Buying Timeline';
  };
  
  const renderTimeline = () => {
    const timelineItems = getTimelineItems();
    
    return (
      <View style={styles.timelineContainer}>
        <View style={styles.timelineTitleContainer}>
          <View style={styles.timelineHeaderContainer}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {getTimelineTitle()}
            </Text>
            
            <TouchableOpacity
              style={[styles.dropdownButton, { borderColor: colors.border }]}
              onPress={() => setTimelineModalVisible(true)}
            >
              <Text style={{ color: colors.primary }}>Change</Text>
              <ChevronDown size={16} color={colors.primary} style={{ marginLeft: 4 }} />
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.timeline}>
          {timelineItems.map((item, index) => (
            <View key={item.id} style={styles.timelineItem}>
              <View style={styles.timelineLeft}>
                <View 
                  style={[
                    styles.timelineDot, 
                    { backgroundColor: colors.primary }
                  ]}
                />
                {index < timelineItems.length - 1 && (
                  <View 
                    style={[
                      styles.timelineLine, 
                      { backgroundColor: colors.border }
                    ]}
                  />
                )}
              </View>
              
              <View style={styles.timelineContent}>
                <Text style={[styles.timelineTitle, { color: colors.text }]}>
                  {item.title}
                </Text>
                <Text style={[styles.timelineDescription, { color: colors.secondary }]}>
                  {item.description}
                </Text>
                <Text style={[styles.timelineDays, { color: colors.primary }]}>
                  {item.days}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  };
  
  const renderToolCards = () => {
    return (
      <View style={styles.toolCards}>
        <TouchableOpacity 
          style={[styles.toolCard, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => setActiveTab('calculator')}
        >
          <Calculator size={24} color={colors.primary} />
          <View style={styles.toolCardContent}>
            <Text style={[styles.toolCardTitle, { color: colors.text }]}>
              Affordability Calculator
            </Text>
            <Text style={[styles.toolCardDescription, { color: colors.secondary }]}>
              Calculate how much home you can afford
            </Text>
            <ChevronRight size={20} color={colors.secondary} style={styles.toolCardIcon} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.toolCard, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => setActiveTab('agents')}
        >
          <Users size={24} color={colors.primary} />
          <View style={styles.toolCardContent}>
            <Text style={[styles.toolCardTitle, { color: colors.text }]}>
              Find Real Estate Agents
            </Text>
            <Text style={[styles.toolCardDescription, { color: colors.secondary }]}>
              Connect with top local agents
            </Text>
            <ChevronRight size={20} color={colors.secondary} style={styles.toolCardIcon} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.toolCard, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => setActiveTab('timeline')}
        >
          <Clock size={24} color={colors.primary} />
          <View style={styles.toolCardContent}>
            <Text style={[styles.toolCardTitle, { color: colors.text }]}>
              Buying Timeline
            </Text>
            <Text style={[styles.toolCardDescription, { color: colors.secondary }]}>
              Understand the home buying process
            </Text>
            <ChevronRight size={20} color={colors.secondary} style={styles.toolCardIcon} />
          </View>
        </TouchableOpacity>
      </View>
    );
  };
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Resources</Text>
      </View>
      
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'overview' && [styles.activeTab, { borderBottomColor: colors.primary }],
          ]}
          onPress={() => setActiveTab('overview')}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'overview' ? colors.primary : colors.text },
            ]}
          >
            Overview
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'calculator' && [styles.activeTab, { borderBottomColor: colors.primary }],
          ]}
          onPress={() => setActiveTab('calculator')}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'calculator' ? colors.primary : colors.text },
            ]}
          >
            Calculator
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'agents' && [styles.activeTab, { borderBottomColor: colors.primary }],
          ]}
          onPress={() => setActiveTab('agents')}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'agents' ? colors.primary : colors.text },
            ]}
          >
            Find Agents
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'timeline' && [styles.activeTab, { borderBottomColor: colors.primary }],
          ]}
          onPress={() => setActiveTab('timeline')}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'timeline' ? colors.primary : colors.text },
            ]}
          >
            Timeline
          </Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView contentContainerStyle={styles.content}>
        {activeTab === 'overview' && renderToolCards()}
        {activeTab === 'calculator' && renderCalculator()}
        {activeTab === 'agents' && renderAgents()}
        {activeTab === 'timeline' && renderTimeline()}
      </ScrollView>

      {/* Timeline Selection Modal */}
      <Modal
        visible={timelineModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setTimelineModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setTimelineModalVisible(false)}
        >
          <View 
            style={[styles.modalContent, { backgroundColor: colors.background }]}
            onStartShouldSetResponder={() => true}
            onTouchEnd={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Select Timeline</Text>
              <TouchableOpacity onPress={() => setTimelineModalVisible(false)}>
                <X size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            {timelineOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.timelineOption,
                  selectedTimeline === option.id && { backgroundColor: colors.primary + '10' }
                ]}
                onPress={() => {
                  setSelectedTimeline(option.id);
                  setTimelineModalVisible(false);
                }}
              >
                <View style={styles.timelineOptionContent}>
                  <Clock size={20} color={selectedTimeline === option.id ? colors.primary : colors.secondary} />
                  <Text 
                    style={[
                      styles.timelineOptionText, 
                      { 
                        color: selectedTimeline === option.id ? colors.primary : colors.text,
                        fontWeight: selectedTimeline === option.id ? '600' : 'normal'
                      }
                    ]}
                  >
                    {option.label}
                  </Text>
                </View>
                {selectedTimeline === option.id && (
                  <View style={[styles.selectedIndicator, { backgroundColor: colors.primary }]} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
  },
  tabText: {
    fontWeight: '500',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  
  // Tool cards styles
  toolCards: {
    marginBottom: 24,
  },
  toolCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  toolCardContent: {
    flex: 1,
    marginLeft: 16,
  },
  toolCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  toolCardDescription: {
    fontSize: 14,
  },
  toolCardIcon: {
    position: 'absolute',
    right: 0,
    top: '50%',
    marginTop: -10,
  },
  
  // Calculator styles
  calculatorContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  resultContainer: {
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
  },
  resultHeader: {
    marginBottom: 16,
  },
  resultTitle: {
    fontSize: 16,
    marginBottom: 4,
  },
  resultPrice: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  resultSubtitle: {
    fontSize: 16,
    marginBottom: 16,
  },
  chart: {
    borderRadius: 16,
    marginBottom: 16,
  },
  breakdown: {
    marginTop: 16,
  },
  breakdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  totalItem: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
  },
  breakdownLabel: {
    fontSize: 14,
  },
  breakdownValue: {
    fontSize: 14,
  },
  
  // Agents styles
  agentsContainer: {
    marginBottom: 20,
  },
  agentCard: {
    flexDirection: 'row',
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  agentPhoto: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 16,
  },
  agentInfo: {
    flex: 1,
  },
  agentName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  agentCompany: {
    fontSize: 14,
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  rating: {
    marginLeft: 4,
    fontSize: 14,
  },
  agentActions: {
    flexDirection: 'row',
  },
  agentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  agentButtonText: {
    marginLeft: 4,
    fontWeight: '500',
    color: 'white',
  },
  
  // Timeline styles
  timelineContainer: {
    marginBottom: 20,
  },
  timelineTitleContainer: {
    marginBottom: 16,
    position: 'relative',
  },
  timelineHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  timeline: {
    marginLeft: 8,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  timelineLeft: {
    width: 20,
    alignItems: 'center',
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    marginTop: 4,
  },
  timelineContent: {
    flex: 1,
    marginLeft: 12,
  },
  timelineTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  timelineDescription: {
    fontSize: 14,
    marginBottom: 4,
  },
  timelineDays: {
    fontSize: 12,
    fontWeight: '500',
  },
  
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxWidth: 400,
    borderRadius: 12,
    padding: 20,
    elevation: 5,
    boxShadow: '0px 2px 3.84px rgba(0, 0, 0, 0.25)',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  timelineOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  timelineOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  timelineOptionText: {
    fontSize: 16,
    marginLeft: 12,
  },
  selectedIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  }
});