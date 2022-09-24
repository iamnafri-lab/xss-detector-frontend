#!/usr/bin/env python3
# capture.py
import netifaces as ni
import pyshark as py
import sys
# print('#Hello from python#')
# print('Port:'+sys.argv[1]+'#')
# print('Second param:'+sys.argv[2]+'#')


port = sys.argv[1]
provided_interface = sys.argv[2]
port = "port "+port

import tensorflow as tf
import numpy as np
import json
import pickle
from keras.preprocessing.sequence import pad_sequences
import random
import nltk
import re
from urllib.parse import unquote

model = tf.keras.models.load_model("file/CNN_LSTM4_9_model")
model2 = tf.keras.models.load_model("file/CNN_LSTM4_1_model")
vec_dir="file/word2vec.pickle"
with open(vec_dir, "rb") as f:
        word2vec = pickle.load(f)
dictionary=word2vec["dictionary"]
embeddings = word2vec["embeddings"]
reverse_dictionary = word2vec["reverse_dictionary"]
train_size=word2vec["train_size"]
test_size=word2vec["test_size"]
dims_num = word2vec["dims_num"]
input_num =word2vec["input_num"]

def to_index(data):
        d_index = []
        for word in data:
            if word in dictionary.keys():
                d_index.append(dictionary[word])
            else:
                d_index.append(dictionary["UNK"])
        return d_index

def GeneSeg(payload):
    payload=payload.lower()
    payload=unquote(unquote(payload))
    payload,num=re.subn(r'\d+',"0",payload)
    payload,num=re.subn(r'(http|https)://[a-zA-Z0-9\.@&/#!#\?]+', "http://u", payload)
    r = '''
        (?x)[\w\.]+?\(
        |\)
        |"\w+?"
        |'\w+?'
        |http://\w
        |</\w+>
        |<\w+>
        |<\w+
        |\w+=
        |>
        |[\w\.]+
    '''
    return nltk.regexp_tokenize(payload, r)

def pre(x):
    datas_index = [to_index(data) for data in x]
    datas_index = pad_sequences(datas_index, value=-1)
    rand = random.sample(range(len(datas_index)), len(datas_index))
    datas = [datas_index[index] for index in rand]
    appendingData = []
    counter = 755-len(datas[0])
    for i in range(counter):
        appendingData.append(-1)
    appendingDataCopy = appendingData
    for j in range(len(datas)):
        for i in range(len(datas[j])):
            appendingDataCopy.append(datas[j][i])
        datas[j] = appendingDataCopy
        appendingDataCopy = []
        for w in range(counter):
            appendingDataCopy.append(-1)
    w = np.asarray(datas, dtype='int32')
    return w


def create_file(w):
    with open("PredictionDataTest.csv", "w") as f:
                for i in range(len(w)):
                    data_line = str(w[i].tolist())+"\n"
                    f.write(data_line)


def data_generator(data_dir):
    df = tf.data.TextLineDataset([data_dir])
    for line in df:
        try:
            [data, label] = tf.strings.split(line, b"|").numpy()
        except:
            [data] = tf.strings.split(line, b"|").numpy()
        data = np.array(json.loads(data.decode("utf-8")))
        label = np.array([])
        yield (data, label)


def batch_generator(datas_dir, datas_size, batch_size, embeddings, reverse_dictionary, train=True):
    batch_data = []
    batch_label = []
    generator = data_generator(datas_dir)
    n = 0
    while True:
        for i in range(batch_size):
            data, label = next(generator)
            data_embed = []
            for d in data:
                if d != -1:
                    data_embed.append(embeddings[reverse_dictionary[d]])
                else:
                    data_embed.append([0.0] * len(embeddings["UNK"]))
            batch_data.append(data_embed)
            batch_label.append(label)
            n += 1
            if not train and n == datas_size:
                break
        if not train and n == datas_size:
            yield (np.array(batch_data), np.array(batch_label))
            break
        else:
            yield (np.array(batch_data), np.array(batch_label))
            batch_data = []
            batch_label = []

        
def predict(w, i):
    if i==0:
        test = batch_generator("PredictionDataTest.csv", len(w), 1, embeddings, reverse_dictionary, train=False)
        arr= model.predict(test)
    if i==1:
        test = batch_generator("PredictionDataTest.csv", len(w), 1, embeddings, reverse_dictionary, train=False)
        arr= model2.predict(test)
    return arr



local_ip = ni.ifaddresses(provided_interface)[ni.AF_INET][0]['addr'] #en0 interface for wifi card on Mac. 
capture = py.LiveCapture(
    interface=provided_interface,
    bpf_filter=port
)

while 1:
    capture.sniff(timeout=10,packet_count = 20)
    sys.stdout.flush()
    if len(capture) > 0:
        for packet in capture:
            if str(packet.ip.dst) == str(local_ip):
                try:
                    if packet.tcp.payload : 
                        payload = str(packet.tcp.payload).replace(":","")
                        bytes_object = bytes.fromhex(payload)
                        payload_string = bytes_object.decode("ASCII")
                        payload_string = payload_string.replace("\n","").replace("\r","").replace("''"," ")
                        payload_string = "\"" + payload_string[payload_string.find("input: ")+9: -10] + "\""
                        payload_string = payload_string.replace("\\","").replace('\\n',"").replace('"n','')
                        payload = payload_string
                        src = packet.ip.src
                        line = payload
                        x=GeneSeg(line)
                        pre_file = pre(x)
                        create_file(pre_file)
                        Yes=0
                        No=0
                        for i in range(2):
                            result = predict(pre_file,i)
                            yes=0
                            no=0
                            for x in range(len(result)):
                                yes += result[x][0]
                                no += result[x][1]
                            No+=no/len(result)
                            Yes+=yes/len(result)
                        Yes = Yes/2
                        No = No/2
                        if Yes>=0.477:
                            print('{ "src" : "%s" , "payload" : %s, "attack" : true }'%(src, payload))
                        else:
                            print('{ "src" : "%s" , "payload" : %s, "attack" : false }'%(src, payload))
                        sys.stdout.flush()
                except:
                    pass
