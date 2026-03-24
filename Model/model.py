import pandas as pd

data = pd.read_csv("data.csv")
data = data.drop(columns=["Unnamed: 0"], axis=1)
# print(data.head())

features = []

for date, group in data.groupby("date"):

    day_df = group

    first_45 = day_df[day_df["time"] <= 33300 + 60*60]

    f1 = round(first_45["open"].max() - first_45["close"].min(), 4)

    f2 = round(day_df["open"].max() - day_df["close"].min(), 4)

    # f1 = round(first_45.iloc[0]["open"] - first_45.iloc[-1]["close"], 4)

    # f2 = round(day_df.iloc[0]["open"] - day_df.iloc[-1]["close"], 4)

    
    day_open = day_df.iloc[0]["open"]
    day_close = day_df.iloc[-1]["close"]

    day_high = day_df["high"].max()
    day_low = day_df["low"].min()


    # f3 = round((day_high - day_low) / day_open, 4)

    # rsi(day_df)
    # f4 = round(day_df["RSI"].iloc[-1], 4)
    
    target = 1 if day_close > day_open else 0

    # features.append([date, f1, f2, f3, f4, target])
    features.append([date, f1, f2, target])

# data = pd.DataFrame(features, columns=["date","first_45min_o/c_diff","day_o/c_diff","volatility","rsi","target"])
data = pd.DataFrame(features, columns=["date","first_45min_o/c_diff","day_o/c_diff","target"])

data["next_day_target"] = data["target"].shift(-1)
data = data.dropna()
data["next_day_target"] = data["next_day_target"].astype(int)
# print(data.head())
# print(data.tail())



X = data.drop(columns = ["date","target","next_day_target"], axis=1)
# X = data.drop(columns = ["date","volatility","rsi","target","next_day_target"], axis=1)
# # print(X.head())

y = data.iloc[:,-1]
# # print(y.head())



from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score,precision_score,recall_score,f1_score
from sklearn.linear_model import LogisticRegression
from sklearn.svm import SVC

X_train,X_test,y_train,y_test = train_test_split(X, y, test_size=0.3, shuffle=False)

# from sklearn.model_selection import cross_val_score,GridSearchCV

# param = {
#     'n_estimators': [100, 200, 300, 500],
#     'max_depth': [None, 5, 10, 15],
#     'min_samples_leaf': [1, 2, 4, 6, 7, 8],
#     'max_features': ['sqrt', 'log2'],
#     'max_leaf_nodes': [1,2,3,4,5]
# }

# grid = GridSearchCV(
#     RandomForestClassifier(),
#     param,
#     cv=5,
#     n_jobs=-1
# )

# grid.fit(X_train,y_train)
# print(grid.best_params_)       # best param for rendom forest classifier -----> {'max_depth': 10, 'max_features': 'sqrt', 'max_leaf_nodes': 4, 'min_samples_leaf': 6, 'n_estimators': 200}


rf = RandomForestClassifier(n_estimators=200,max_depth=10,max_leaf_nodes=4,min_samples_leaf=6)

rf.fit(X_train,y_train)
y_pred = rf.predict(X_test)

accuracy = accuracy_score(y_test,y_pred)

# importance = rf.feature_importances_

# for f,i in zip(X.columns,importance):
#     print(f,i)


# from sklearn.feature_selection import RFE

# selector = RFE(rf, n_features_to_select=1)

# selector.fit(X,y)

# print(selector.support_)
# print(X.columns[selector.support_])

# precision = precision_score(y_test,y_pred)
# recall = recall_score(y_test,y_pred)
# f1 = f1_score(y_test,y_pred)


print("Rendomforest classifier --> ", accuracy)
# result = rf.predict([[218.85, 356.55]])
# result = rf.predict([[135.15, 773.75]])
# print(result)


# param = {
#     'max_iter': [100,200,300,400,500],
#     'penalty': ['l1', 'l2', 'elasticnet'],
#     'solver': ['lbfgs', 'liblinear', 'newton-cg', 'newton-cholesky', 'sag', 'saga'],

# }

# grid = GridSearchCV(
#     LogisticRegression(),
#     param,
#     cv=5,
#     n_jobs=-1
# )

# grid.fit(X_train,y_train)
# print(grid.best_params_) 

lr = LogisticRegression(max_iter=100)
lr.fit(X_train,y_train)
y_pred = lr.predict(X_test)
acc = accuracy_score(y_test,y_pred)

print("Logistic regression --> ", acc)

# result = lr.predict([[232.70,390.95]])
# print(result)

# sv = SVC(max_iter=50)
# sv.fit(X_train,y_train)
# y_pred = sv.predict(X_test)
# acc = accuracy_score(y_pred,y_test)
# print(acc)








