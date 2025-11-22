
# Importar librerías necesarias
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
import statsmodels.api as sn
from sklearn.preprocessing import StandardScaler
from sklearn.svm import SVR
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import TargetEncoder
from sklearn.feature_selection import mutual_info_regression
from sklearn.metrics import r2_score, mean_absolute_percentage_error

df=pd.read_csv('Analisis/base.csv')
df.head()

# Reemplazar los valores nulos de la columna market_value_in_eur por 0
df['market_value_in_eur'] = df['market_value_in_eur'].fillna(0)

# Verificar que ya no queden nulos
print(df['market_value_in_eur'].isnull().sum())

#Dentro del dataset tambien se consideran a jugadores prestados,
# eliminamos los datos de valores transferidos por prestamo considerando solo
# las observaciones cuyo valor de transferencia sea mayor al 40% de su valor de mercado
df=df.loc[df['market_value_in_eur']*0.4<df['transfer_fee'],:].reset_index(drop=True)
df.shape

# Mantenemos solo las posiciones principales de cada jugador
df['Pos']=df['Pos'].str.split(',').str[0]
df['Pos'].value_counts()

#Division de la muestra en la variable dependiente Y y las variables independientes X
y = df['transfer_fee']
exclude_cols = ['transfer_fee', 'transfer_date','player_name','from_club_name','Born','to_club_name','previous_season','transfer_season']
X = df.drop(columns=exclude_cols)
X.head()

#Conversion de las variables categoricas en dummies
X_dummies = pd.get_dummies(X[['Pos',
                              'Comp',
                              'season_year'
                              ]], drop_first=True)
X_dummies

X.columns

X_target=X[['Nation','Squad']]
encoder=TargetEncoder()
X_target_encoded=encoder.fit_transform(X_target,y)
X_target_encoded=pd.DataFrame(X_target_encoded,columns=X_target.columns)
X_target_encoded.head()

# Concatenacion de los  (excluding the original 'team' column)
X = pd.concat([X.drop(columns=['Nation','Pos','Comp',
                              'Squad',
                              'season_year']), X_dummies,X_target_encoded], axis=1)
X.head()
X.info()

# Particion de la muestra en train y test relacion (80,20)
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

mi = mutual_info_regression(X_train, y_train, random_state=42)


mi_df = pd.Series(mi, index=X_train.columns, name='mutual_info').sort_values(ascending=False)


threshold = 0.01
selected_features = mi_df[mi_df > threshold].index

X_train_filtered = X_train[selected_features]
X_test_filtered = X_test[selected_features]

print(f"Selected {len(selected_features)} features out of {X_train.shape[1]}")
print(selected_features)
print(X_train_filtered.head())

"""#### Modelo Support Vector Machiene (SVM)"""

# Escalar
sc = StandardScaler().fit(X_train_filtered)

# Transformacion de datos de train y test con escalar
X_train_std = sc.transform(X_train_filtered)
X_test_std = sc.transform(X_test_filtered)

# Modelo
svr = SVR(kernel='linear', C = 500)
svr.fit(X_train_std, y_train)

# Estimacion de la prediccion
y_test_pred_svm = svr.predict(X_test_std)
y_train_pred_svm = svr.predict(X_train_std)

# Parametros de interpretación
# R² Score
r2 = r2_score(y_test, y_test_pred_svm)
print(f"R² Score: {r2:.4f}")

# MAPE
mape = mean_absolute_percentage_error(y_test, y_test_pred_svm)
print(f"MAPE: {mape:.4f}")

"""## Prediccion"""


base_completa=pd.read_csv('Modelos/Prediccion/base_completa.csv')
base_completa.head()

base_completa['market_value_in_eur'] = base_completa['market_value_in_eur'].fillna(0)
base_completa['Pos']=base_completa['Pos'].str.split(',').str[0]

exclude_cols = ['Born','previous_season']
X_pred = base_completa.drop(columns=exclude_cols)

X_pred_dummies = pd.get_dummies(X_pred[['Pos',
                              'Comp',
                              'season_year'
                              ]], drop_first=True)
X_pred_target_encoded=encoder.transform(X_pred[['Nation','Squad']])
X_pred_target_encoded=pd.DataFrame(X_pred_target_encoded,columns=X_target.columns)

X_pred = pd.concat([X_pred.drop(columns=['Nation','Pos','Comp',
                              'Squad',
                              'season_year']), X_pred_dummies,X_pred_target_encoded], axis=1)

X_pred_filtered = X_pred[selected_features]

"""### SVM"""

X_pred_dummies.shape

X_pred_std = sc.transform(X_pred_filtered)
y_pred_svm = svr.predict(X_pred_std)

import joblib
import json

# Save model
joblib.dump(svr, "Modelos/Artefactos/svm_model.pkl")

# Save scaler
joblib.dump(sc, "Modelos/Artefactos/scaler.pkl")

# Save target encoder
joblib.dump(encoder, "Modelos/Artefactos/target_encoder.pkl")

# Save selected columns
with open("Modelos/Artefactos/selected_features.json", "w") as f:
    json.dump(list(selected_features), f)


base_completa['prediccion']=y_pred_svm

base_completa.head()

base_completa=base_completa.drop_duplicates()

base_completa.sort_values(by='prediccion',ascending=False).head(10)

base_completa.to_json('Dashboard/players.json',orient='records')

