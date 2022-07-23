import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";

import { useTheme } from "styled-components";
import { useAuth } from "../../hooks/auth";
import { HighlightCard } from "../../Components/HighlightCard";
import {
  TransactionCard,
  TransactionCardProps,
} from "../../Components/TransactionCard";
import {
  Container,
  Header,
  UserWrapper,
  UserInfo,
  Photo,
  User,
  UserGreeting,
  UserName,
  Icon,
  HighlightCards,
  Transactions,
  Title,
  TransactionList,
  LogoutButton,
  LoadContainer,
} from "./styles";

export interface DataListPros extends TransactionCardProps {
  id: string;
}
interface HighLightProps {
  amount: string;
}

interface HightLightData {
  entries: HighLightProps;
  expensives: HighLightProps;
  total: HighLightProps;
}

export function Dashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [transactions, setTransactions] = useState<DataListPros[]>([]);
  const [highLightData, setHighLightData] = useState<HightLightData>(
    {} as HightLightData
  );
  const [lastTransactionsEntries, setLastTransactionsEntries] = useState("");
  const [lastTransactionsExpensive, setLastTransactionsExpensive] =
    useState("");
  const [totalInterval, setTotalInterval] = useState("");

  const theme = useTheme();

  const { signOut, user } = useAuth();

  async function loadTransactions() {
    const dataKey = `@gofinances:transactions_user:${user.id}`;
    const response = await AsyncStorage.getItem(dataKey);
    const transactions = response ? JSON.parse(response) : [];

    let entriesTotal = 0;
    let expensiveTotal = 0;

    const transactionsFormatted: DataListPros[] = transactions.map(
      (item: DataListPros) => {
        if (item.type === "positive") {
          entriesTotal += Number(item.amount);
        } else {
          expensiveTotal += Number(item.amount);
        }

        const amount = Number(item.amount).toLocaleString("pt-BR", {
          style: "currency",
          currency: "BRL",
        });

        const date = Intl.DateTimeFormat("pt-BR", {
          day: "2-digit",
          month: "2-digit",
          year: "2-digit",
        }).format(new Date(item.date));

        return {
          id: item.id,
          name: item.name,
          amount,
          type: item.type,
          category: item.category,
          date,
        };
      }
    );

    setTransactions(transactionsFormatted);

    const total = entriesTotal - expensiveTotal;

    const lasTransactionEntriesDate = new Date(
      Math.max.apply(
        Math,
        transactions
          .filter((transaction: DataListPros) => transaction.type == "positive")
          .map((transaction: DataListPros) =>
            new Date(transaction.date).getTime()
          )
      )
    );

    setLastTransactionsEntries(
      lasTransactionEntriesDate.getDate() != lasTransactionEntriesDate.getDate()
        ? " "
        : `ultima saida dia ${lasTransactionEntriesDate.getDate()} de ${lasTransactionEntriesDate.toLocaleString(
            "pt-BR",
            { month: "long" }
          )}`
    );

    const lastTransactionExpensiveDate = new Date(
      Math.max.apply(
        Math,
        transactions
          .filter((transaction: DataListPros) => transaction.type == "negative")
          .map((transaction: DataListPros) =>
            new Date(transaction.date).getTime()
          )
      )
    );

    setLastTransactionsExpensive(
      lastTransactionExpensiveDate.getDate() !=
        lastTransactionExpensiveDate.getDate()
        ? " "
        : `ultima saida dia ${lastTransactionExpensiveDate.getDate()} de ${lastTransactionExpensiveDate.toLocaleString(
            "pt-BR",
            { month: "long" }
          )}`
    );

    setTotalInterval(
      lastTransactionExpensiveDate.getDate() !=
        lastTransactionExpensiveDate.getDate()
        ? "Não há movimentações"
        : `01 a ${lastTransactionsExpensive}`
    );

    setHighLightData({
      entries: {
        amount: entriesTotal.toLocaleString("pt-BR", {
          style: "currency",
          currency: "BRL",
        }),
      },
      expensives: {
        amount: expensiveTotal.toLocaleString("pt-BR", {
          style: "currency",
          currency: "BRL",
        }),
      },
      total: {
        amount: total.toLocaleString("pt-BR", {
          style: "currency",
          currency: "BRL",
        }),
      },
    });
    setIsLoading(false);
  }

  useEffect(() => {
    loadTransactions();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadTransactions();
    }, [])
  );

  return (
    <Container>
      {isLoading ? (
        <LoadContainer>
          <ActivityIndicator color={theme.colors.primary} size="large" />
        </LoadContainer>
      ) : (
        <>
          <Header>
            <UserWrapper>
              <UserInfo>
                <Photo source={{ uri: user.photo }} />
                <User>
                  <UserGreeting>Olá, </UserGreeting>
                  <UserName>{user.name}</UserName>
                </User>
              </UserInfo>
              <LogoutButton onPress={signOut}>
                <Icon name="power" />
              </LogoutButton>
            </UserWrapper>
          </Header>

          <HighlightCards>
            <HighlightCard
              title="Entradas"
              amount={highLightData.entries.amount}
              lastTransaction={lastTransactionsEntries}
              type="up"
            />
            <HighlightCard
              title="Saídas"
              amount={highLightData.expensives.amount}
              lastTransaction={lastTransactionsExpensive}
              type="down"
            />
            <HighlightCard
              title="Total"
              amount={highLightData.total.amount}
              lastTransaction={totalInterval}
              type="total"
            />
          </HighlightCards>

          <Transactions>
            <Title>Listagem</Title>
            <TransactionList
              data={transactions}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => <TransactionCard data={item} />}
            />
          </Transactions>
        </>
      )}
    </Container>
  );
}
